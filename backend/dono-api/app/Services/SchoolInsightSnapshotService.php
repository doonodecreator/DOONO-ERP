<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Result;
use App\Models\School;
use App\Models\SchoolInsightSnapshot;
use App\Models\Student;
use Carbon\CarbonImmutable;

class SchoolInsightSnapshotService
{
    public function metrics(School $school, int $periodDays = 30, ?CarbonImmutable $asOf = null): array
    {
        $asOf ??= CarbonImmutable::now();
        $periodDays = min(max($periodDays, 7), 365);
        $from = $asOf->subDays($periodDays)->startOfDay();
        $schoolId = (int) $school->id;

        $attendance = Attendance::query()
            ->whereHas('studentEnrollment', fn ($query) => $query->where('school_id', $schoolId))
            ->whereDate('attendance_date', '>=', $from->toDateString())
            ->whereDate('attendance_date', '<=', $asOf->toDateString())
            ->get(['status', 'attendance_date']);

        $attendanceTotal = $attendance->count();
        $attendancePresent = $attendance->whereIn('status', ['Present', 'Late'])->count();
        $attendancePercentage = $attendanceTotal > 0
            ? round(($attendancePresent / $attendanceTotal) * 100, 1)
            : null;

        $publishedResults = Result::query()
            ->where('school_id', $schoolId)
            ->where('is_published', true)
            ->whereNotNull('total_score')
            ->with(['subject:id,name'])
            ->get(['subject_id', 'total_score']);

        $subjectAverages = $publishedResults
            ->groupBy('subject_id')
            ->map(fn ($rows) => [
                'subject' => $rows->first()->subject?->name ?: 'Unknown subject',
                'average_score' => round((float) $rows->avg('total_score'), 1),
                'result_count' => $rows->count(),
            ])
            ->values()
            ->sortBy('average_score')
            ->values()
            ->all();

        return [
            'school' => ['id' => $school->id, 'name' => $school->name],
            'period' => ['from' => $from->toDateString(), 'to' => $asOf->toDateString(), 'days' => $from->diffInDays($asOf)],
            'facts' => [
                'active_students' => Student::where('school_id', $schoolId)->where('status', 'Active')->count(),
                'attendance_percentage' => $attendancePercentage,
                'attendance_records' => $attendanceTotal,
                'published_result_count' => $publishedResults->count(),
                'average_published_score' => $publishedResults->count() > 0 ? round((float) $publishedResults->avg('total_score'), 1) : null,
            ],
            'subject_averages' => $subjectAverages,
        ];
    }

    public function capture(School $school, int $periodDays = 30, ?CarbonImmutable $asOf = null): SchoolInsightSnapshot
    {
        $asOf ??= CarbonImmutable::now();
        $metrics = $this->metrics($school, $periodDays, $asOf);

        return SchoolInsightSnapshot::updateOrCreate(
            [
                'school_id' => $school->id,
                'snapshot_date' => $asOf->toDateString(),
                'period_days' => $metrics['period']['days'],
            ],
            [
                ...$metrics['facts'],
                'subject_averages' => $metrics['subject_averages'],
            ]
        );
    }
}

