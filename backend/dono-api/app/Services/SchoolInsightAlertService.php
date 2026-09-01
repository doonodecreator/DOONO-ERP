<?php

namespace App\Services;

use App\Models\SchoolInsightAlert;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SchoolInsightAlertService
{
    public function sync(int $schoolId, string $periodStart, Collection|array $warnings): Collection
    {
        return collect($warnings)->map(function (array $warning) use ($schoolId, $periodStart) {
            $alertKey = sprintf(
                '%s:%s:%s',
                $periodStart,
                $warning['type'] ?? 'review',
                Str::substr(hash('sha256', (string) ($warning['message'] ?? '')), 0, 24),
            );

            return SchoolInsightAlert::query()->updateOrCreate(
                [
                    'school_id' => $schoolId,
                    'alert_key' => $alertKey,
                ],
                [
                    'type' => $warning['type'] ?? 'review',
                    'severity' => $warning['severity'] ?? 'info',
                    'title' => $warning['title'] ?? 'Review notice',
                    'message' => $warning['message'] ?? 'Review the available evidence.',
                    'evidence' => [
                        'period_start' => $periodStart,
                        'source' => 'school_insights',
                    ],
                ],
            );
        });
    }
}
