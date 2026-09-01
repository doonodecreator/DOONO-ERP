<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunicationDelivery;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class TwilioWebhookController extends Controller
{
    public function status(Request $request)
    {
        $authToken = trim((string) config('services.twilio.auth_token'));
        $signature = trim((string) $request->header('X-Twilio-Signature'));
        if ($authToken === '' || $signature === '' || ! $this->validSignature($request, $authToken, $signature)) {
            return response()->json(['message' => 'Invalid Twilio webhook signature.'], 403);
        }

        $providerMessageId = trim((string) $request->input('MessageSid'));
        $providerStatus = strtolower(trim((string) ($request->input('MessageStatus') ?: $request->input('SmsStatus'))));
        if ($providerMessageId === '' || $providerStatus === '') {
            return response()->json(['accepted' => true]);
        }

        $delivery = CommunicationDelivery::query()
            ->where('provider', 'twilio')
            ->where('provider_message_id', $providerMessageId)
            ->first();
        if (! $delivery) {
            return response()->json(['accepted' => true]);
        }

        $nextStatus = match ($providerStatus) {
            'delivered', 'read' => 'delivered',
            'failed', 'undelivered' => 'failed',
            'queued', 'accepted', 'sending', 'sent' => 'provider_accepted',
            default => null,
        };
        if (! $nextStatus) {
            return response()->json(['accepted' => true]);
        }

        $rank = ['pending' => 0, 'sending' => 1, 'provider_accepted' => 2, 'failed' => 3, 'delivered' => 4];
        if (($rank[$nextStatus] ?? 0) < ($rank[$delivery->status] ?? 0)) {
            return response()->json(['accepted' => true]);
        }

        $failed = in_array($nextStatus, ['failed'], true);
        $delivered = $nextStatus === 'delivered';
        $delivery->forceFill([
            'status' => $nextStatus,
            'delivered_at' => $delivered ? now() : $delivery->delivered_at,
            'failed_at' => $failed ? now() : $delivery->failed_at,
            'failure_code' => $request->input('ErrorCode') ?: $delivery->failure_code,
            'failure_message' => $request->input('ErrorMessage') ?: $delivery->failure_message,
            'provider_metadata' => [
                'status' => $providerStatus,
                'message_sid' => $providerMessageId,
            ],
        ])->save();

        \App\Jobs\ProcessCommunicationDelivery::refreshCommunicationStatus((int) $delivery->communication_id);
        ActivityLogService::log(
            module: 'communication_delivery',
            action: 'twilio_status_received',
            description: 'A verified Twilio delivery status callback updated an SMS delivery record.',
            subject: $delivery,
            properties: ['provider_status' => $providerStatus, 'delivery_status' => $nextStatus],
            schoolId: (int) $delivery->school_id,
        );

        return response()->json(['accepted' => true]);
    }

    private function validSignature(Request $request, string $authToken, string $signature): bool
    {
        $url = trim((string) config('services.twilio.webhook_url')) ?: $request->fullUrl();
        $params = $request->all();
        ksort($params);
        $payload = $url;
        foreach ($params as $key => $value) {
            $payload .= $key.(is_scalar($value) ? (string) $value : json_encode($value));
        }

        $expected = base64_encode(hash_hmac('sha1', $payload, $authToken, true));

        return hash_equals($expected, $signature);
    }
}
