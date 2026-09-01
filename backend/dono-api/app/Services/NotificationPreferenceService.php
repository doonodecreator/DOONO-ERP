<?php

namespace App\Services;

use App\Models\NotificationPreference;
use Illuminate\Support\Facades\Cache;

class NotificationPreferenceService
{
    public function enabled(int $userId, ?int $schoolId, string $type, string $channel): bool
    {
        foreach ([$schoolId, null] as $scopeSchoolId) {
            $preference = Cache::remember(
                $this->cacheKey($userId, $scopeSchoolId, $type, $channel),
                now()->addMinutes(5),
                fn () => NotificationPreference::query()
                    ->where('user_id', $userId)
                    ->where('school_id', $scopeSchoolId)
                    ->whereIn('notification_type', [$type, 'all'])
                    ->where('channel', $channel)
                    ->orderByRaw("CASE WHEN notification_type = ? THEN 0 ELSE 1 END", [$type])
                    ->first()
            );
            if ($preference) {
                return (bool) $preference->is_enabled;
            }
        }

        return true;
    }

    public function forget(int $userId, ?int $schoolId, string $type, string $channel): void
    {
        Cache::forget($this->cacheKey($userId, $schoolId, $type, $channel));
        Cache::forget($this->cacheKey($userId, $schoolId, 'all', $channel));
    }

    private function cacheKey(int $userId, ?int $schoolId, string $type, string $channel): string
    {
        return 'doono:notification-preference:' . $userId . ':' . ($schoolId ?? 'global') . ':' . $type . ':' . $channel;
    }
}
