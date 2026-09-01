<?php

namespace App\Services;

use App\Jobs\ProcessCommunicationDelivery;
use App\Models\Communication;
use App\Models\CommunicationDelivery;
use App\Models\UserPushToken;
use Illuminate\Support\Facades\DB;

class CommunicationDeliveryService
{
    public function __construct(private NotificationService $notifications) {}

    public function queueForCommunication(Communication $communication, string $channel): int
    {
        $recipientIds = $this->notifications->recipientIdsForCommunication($communication);
        if ($recipientIds === []) {
            return 0;
        }

        $created = 0;
        foreach ($recipientIds as $userId) {
            if (! $this->notificationsEnabled((int) $userId, (int) $communication->school_id, (string) $communication->type, $channel)) {
                continue;
            }

            if ($channel === 'sms') {
                $phone = $this->phoneForUser((int) $userId, (int) $communication->school_id);
                if (! $phone) {
                    continue;
                }

                $delivery = CommunicationDelivery::firstOrCreate(
                    [
                        'communication_id' => $communication->id,
                        'user_id' => $userId,
                        'channel' => 'sms',
                        'push_token_id' => null,
                    ],
                    [
                        'school_id' => $communication->school_id,
                        'provider' => 'twilio',
                        'destination' => $phone,
                        'status' => 'pending',
                    ],
                );

                if ($delivery->wasRecentlyCreated) {
                    ProcessCommunicationDelivery::dispatch($delivery->id)->onQueue('communications');
                    $created++;
                }
                continue;
            }

            if ($channel === 'push') {
                $tokens = UserPushToken::query()
                    ->where('school_id', $communication->school_id)
                    ->where('user_id', $userId)
                    ->whereNull('revoked_at')
                    ->get();

                foreach ($tokens as $token) {
                    $delivery = CommunicationDelivery::firstOrCreate(
                        [
                            'communication_id' => $communication->id,
                            'user_id' => $userId,
                            'channel' => 'push',
                            'push_token_id' => $token->id,
                        ],
                        [
                            'school_id' => $communication->school_id,
                            'provider' => 'fcm',
                            'destination' => $token->token_hash,
                            'status' => 'pending',
                        ],
                    );

                    if ($delivery->wasRecentlyCreated) {
                        ProcessCommunicationDelivery::dispatch($delivery->id)->onQueue('communications');
                        $created++;
                    }
                }
            }
        }

        return $created;
    }

    public function phoneForUser(int $userId, int $schoolId): ?string
    {
        $staffPhone = DB::table('staff')
            ->where('school_id', $schoolId)
            ->where('user_id', $userId)
            ->value('phone');
        if (is_string($staffPhone) && trim($staffPhone) !== '') {
            return trim($staffPhone);
        }

        $guardianPhone = DB::table('guardians')
            ->where('school_id', $schoolId)
            ->where('user_id', $userId)
            ->value('phone');

        return is_string($guardianPhone) && trim($guardianPhone) !== '' ? trim($guardianPhone) : null;
    }

    private function notificationsEnabled(int $userId, int $schoolId, string $type, string $channel): bool
    {
        return app(NotificationPreferenceService::class)->enabled($userId, $schoolId, $type ?: 'notice', $channel);
    }
}
