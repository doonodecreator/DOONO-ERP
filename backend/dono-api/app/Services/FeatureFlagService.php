<?php

namespace App\Services;

use App\Models\FeatureFlag;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService
{
    public function __construct(private CurrentContextService $context) {}

    public function enabled(string $key, ?User $user = null): bool
    {
        $user ??= auth()->user();
        $school = $user ? $this->context->currentSchool($user) : null;
        $organization = $user ? $this->context->currentOrganization($user, $school) : null;

        $candidates = collect([
            ['scope_type' => 'school', 'scope_id' => $school?->id],
            ['scope_type' => 'organization', 'scope_id' => $organization?->id],
            ['scope_type' => 'platform', 'scope_id' => null],
        ])->filter(fn (array $scope) => $scope['scope_type'] === 'platform' || $scope['scope_id']);

        foreach ($candidates as $scope) {
            $flag = Cache::remember(
                $this->cacheKey($key, $scope['scope_type'], $scope['scope_id']),
                now()->addMinutes(5),
                fn () => FeatureFlag::query()->where('key', $key)->where('scope_type', $scope['scope_type'])->where('scope_id', $scope['scope_id'])->first()
            );
            if ($flag) {
                return $this->passesRollout($flag, $user?->id ?? 0);
            }
        }

        return false;
    }

    public function forget(string $key, string $scopeType, ?int $scopeId = null): void
    {
        Cache::forget($this->cacheKey($key, $scopeType, $scopeId));
    }

    private function passesRollout(FeatureFlag $flag, int $subjectId): bool
    {
        if (! $flag->is_enabled || $flag->rollout_percentage < 1) {
            return false;
        }
        if ($flag->rollout_percentage >= 100) {
            return true;
        }

        return (abs(crc32($flag->key . ':' . $flag->scope_type . ':' . ($flag->scope_id ?? 'platform') . ':' . $subjectId)) % 100) < $flag->rollout_percentage;
    }

    private function cacheKey(string $key, string $scopeType, ?int $scopeId): string
    {
        return 'doono:feature-flag:' . $key . ':' . $scopeType . ':' . ($scopeId ?? 'platform');
    }
}
