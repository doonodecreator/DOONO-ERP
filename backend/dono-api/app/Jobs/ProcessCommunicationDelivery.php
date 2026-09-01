<?php

namespace App\Jobs;

use App\Models\CommunicationDelivery;
use App\Models\UserPushToken;
use App\Services\FcmPushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ProcessCommunicationDelivery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function backoff(): array
    {
        return [60, 300];
    }

    public function __construct(public int $deliveryId) {}

    public function handle(FcmPushService $fcm): void
    {
        $delivery = CommunicationDelivery::query()->find($this->deliveryId);
        if (! $delivery || in_array($delivery->status, ['delivered', 'provider_accepted'], true)) {
            return;
        }

        $delivery->forceFill([
            'status' => 'sending',
            'attempts' => (int) $delivery->attempts + 1,
            'attempted_at' => now(),
            'failure_code' => null,
            'failure_message' => null,
        ])->save();

        try {
            $result = match ($delivery->channel) {
                'sms' => $this->sendSms($delivery),
                'push' => $this->sendPush($delivery, $fcm),
                default => throw new RuntimeException('Unsupported external communication channel.'),
            };

            $delivery->forceFill([
                'status' => 'provider_accepted',
                'provider_message_id' => $result['provider_message_id'] ?? null,
                'provider_accepted_at' => now(),
                'provider_metadata' => $result['metadata'] ?? null,
            ])->save();
        } catch (Throwable $exception) {
            report($exception);
            if ($this->attempts() < $this->tries) {
                $delivery->forceFill([
                    'status' => 'pending',
                    'failure_code' => $exception::class,
                    'failure_message' => substr($exception->getMessage(), 0, 2000),
                ])->save();
                throw $exception;
            }

            $delivery->forceFill([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_code' => $exception::class,
                'failure_message' => substr($exception->getMessage(), 0, 2000),
            ])->save();
        }

        self::refreshCommunicationStatus((int) $delivery->communication_id);
    }

    private function sendSms(CommunicationDelivery $delivery): array
    {
        $accountSid = trim((string) config('services.twilio.account_sid'));
        $authToken = trim((string) config('services.twilio.auth_token'));
        $messagingServiceSid = trim((string) config('services.twilio.messaging_service_sid'));
        $from = trim((string) config('services.twilio.from'));

        if ($accountSid === '' || $authToken === '' || ($messagingServiceSid === '' && $from === '')) {
            throw new RuntimeException('Twilio SMS delivery is not configured.');
        }

        $communication = $delivery->communication()->firstOrFail();
        $payload = [
            'To' => $delivery->destination,
            'Body' => trim(($communication->subject ? $communication->subject."\n" : '').$communication->body),
        ];
        if ($messagingServiceSid !== '') {
            $payload['MessagingServiceSid'] = $messagingServiceSid;
        } else {
            $payload['From'] = $from;
        }

        $callbackUrl = trim((string) config('services.twilio.status_callback_url'));
        if ($callbackUrl === '') {
            throw new RuntimeException('Twilio SMS delivery requires a public status-callback URL.');
        }
        $payload['StatusCallback'] = $callbackUrl;

        $response = Http::asForm()
            ->withBasicAuth($accountSid, $authToken)
            ->timeout(20)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", $payload);
        $response->throw();
        $json = $response->json();

        return [
            'provider_message_id' => is_string($json['sid'] ?? null) ? $json['sid'] : null,
            'metadata' => [
                'status' => $json['status'] ?? null,
                'date_created' => $json['date_created'] ?? null,
                'num_segments' => $json['num_segments'] ?? null,
            ],
        ];
    }

    private function sendPush(CommunicationDelivery $delivery, FcmPushService $fcm): array
    {
        $token = UserPushToken::query()
            ->whereKey($delivery->push_token_id)
            ->where('school_id', $delivery->school_id)
            ->where('user_id', $delivery->user_id)
            ->whereNull('revoked_at')
            ->first();
        if (! $token) {
            throw new RuntimeException('The push token is no longer active.');
        }

        $communication = $delivery->communication()->firstOrFail();
        try {
            return $fcm->send($token->token, $communication->subject ?: 'School notice', $communication->body);
        } catch (Throwable $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'unregistered') || str_contains(strtolower($exception->getMessage()), 'not found')) {
                $token->forceFill(['revoked_at' => now()])->save();
            }
            throw $exception;
        }
    }

    public static function refreshCommunicationStatus(int $communicationId): void
    {
        $deliveries = CommunicationDelivery::query()->where('communication_id', $communicationId)->get(['status']);
        $total = $deliveries->count();
        $failed = $deliveries->where('status', 'failed')->count();
        $pending = $deliveries->whereIn('status', ['pending', 'sending'])->count();
        $accepted = $deliveries->where('status', 'provider_accepted')->count();
        $delivered = $deliveries->where('status', 'delivered')->count();

        $status = match (true) {
            $total === 0 => 'no_recipients',
            $pending > 0 => 'queued',
            $delivered === $total => 'delivered',
            $accepted + $delivered === $total => 'provider_accepted',
            $failed === $total => 'failed',
            default => 'partially_delivered',
        };

        \App\Models\Communication::query()->whereKey($communicationId)->update([
            'delivery_status' => $status,
            'delivery_recipient_count' => $total,
            'delivered_at' => $status === 'delivered' ? now() : null,
            'delivery_error' => $failed > 0 ? "{$failed} delivery attempt(s) failed." : null,
            'updated_at' => now(),
        ]);
    }
}
