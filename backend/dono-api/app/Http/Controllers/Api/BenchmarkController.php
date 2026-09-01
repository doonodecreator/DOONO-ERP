<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolBenchmarkConsent;
use App\Models\SchoolInsightSnapshot;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BenchmarkController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function status(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $consent = SchoolBenchmarkConsent::query()->firstOrCreate(['school_id' => $schoolId]);
        return response()->json(['data' => [
            'school_id' => $schoolId,
            'is_opted_in' => (bool) $consent->is_opted_in,
            'consented_at' => $consent->consented_at,
            'revoked_at' => $consent->revoked_at,
        ]]);
    }

    public function consent(Request $request)
    {
        $schoolId = $this->resolveSchoolId($request);
        $data = $request->validate(['is_opted_in' => ['required', 'boolean']]);
        $optedIn = (bool) $data['is_opted_in'];
        $consent = SchoolBenchmarkConsent::query()->updateOrCreate(
            ['school_id' => $schoolId],
            [
                'is_opted_in' => $optedIn,
                'consented_by' => $request->user()->id,
                'consented_at' => $optedIn ? now() : null,
                'revoked_at' => $optedIn ? null : now(),
            ],
        );
        ActivityLogService::log(
            module: 'benchmarking',
            action: $optedIn ? 'opted_in' : 'opted_out',
            description: $optedIn ? 'The school opted into anonymous aggregate benchmarking.' : 'The school revoked benchmarking consent.',
            subject: $consent,
            schoolId: $schoolId,
        );
        return response()->json(['message' => $optedIn ? 'Anonymous benchmarking enabled.' : 'Benchmarking consent revoked.', 'data' => $consent]);
    }

    public function platformSummary(Request $request)
    {
        $periodDays = $request->integer('period_days', 30);
        $minimumSchools = min(max($request->integer('minimum_schools', 5), 5), 1000);
        abort_unless(in_array($periodDays, [7, 30, 90], true), 422, 'period_days must be 7, 30, or 90.');

        $schoolIds = SchoolBenchmarkConsent::query()
            ->where('is_opted_in', true)
            ->whereNull('revoked_at')
            ->pluck('school_id');
        $snapshots = SchoolInsightSnapshot::query()
            ->whereIn('school_id', $schoolIds)
            ->where('period_days', $periodDays)
            ->latest('snapshot_date')
            ->get(['school_id', 'snapshot_date', 'period_days', 'active_students', 'attendance_percentage', 'published_result_count', 'average_published_score'])
            ->groupBy('school_id')
            ->map(fn ($items) => $items->first())
            ->values();

        $count = $snapshots->count();
        if ($count < $minimumSchools) {
            return response()->json([
                'data' => [
                    'eligible_school_count' => $count,
                    'minimum_schools' => $minimumSchools,
                    'period_days' => $periodDays,
                    'available' => false,
                    'message' => 'Aggregate benchmarking is withheld until the minimum consented cohort is available.',
                ],
            ]);
        }

        $metricFields = [
            'active_students',
            'attendance_percentage',
            'published_result_count',
            'average_published_score',
        ];
        $confidenceIntervals = [];
        foreach ($metricFields as $field) {
            $confidenceIntervals[$field] = $this->confidenceInterval($snapshots, $field);
        }

        return response()->json(['data' => [
            'eligible_school_count' => $count,
            'minimum_schools' => $minimumSchools,
            'period_days' => $periodDays,
            'available' => true,
            'metrics' => [
                'average_active_students' => round((float) $snapshots->avg('active_students'), 2),
                'average_attendance_percentage' => round((float) $snapshots->avg('attendance_percentage'), 2),
                'average_published_result_count' => round((float) $snapshots->avg('published_result_count'), 2),
                'average_published_score' => round((float) $snapshots->avg('average_published_score'), 2),
            ],
            'confidence_intervals_95' => $confidenceIntervals,
            'interpretation' => 'These are anonymous school-level descriptive aggregates, not predictions or rankings.',
        ]]);
    }

    private function confidenceInterval(Collection $snapshots, string $field): array
    {
        $values = $snapshots->pluck($field)
            ->filter(fn ($value) => is_numeric($value))
            ->map(fn ($value) => (float) $value)
            ->values();
        $count = $values->count();
        $mean = $count > 0 ? (float) $values->avg() : 0.0;
        if ($count < 2) {
            return [
                'sample_size' => $count,
                'mean' => round($mean, 2),
                'lower' => round($mean, 2),
                'upper' => round($mean, 2),
                'available' => false,
            ];
        }

        $variance = $values->sum(fn (float $value) => ($value - $mean) ** 2) / ($count - 1);
        $margin = 1.96 * sqrt($variance / $count);

        return [
            'sample_size' => $count,
            'mean' => round($mean, 2),
            'lower' => round($mean - $margin, 2),
            'upper' => round($mean + $margin, 2),
            'available' => true,
        ];
    }

    private function resolveSchoolId(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');
        return (int) $schoolId;
    }
}
