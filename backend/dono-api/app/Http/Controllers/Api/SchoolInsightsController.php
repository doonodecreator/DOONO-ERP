<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SchoolInsightSnapshotService;
use App\Services\CurrentContextService;
use App\Services\SchoolInsightAlertService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class SchoolInsightsController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private SchoolInsightAlertService $alerts,
        private SchoolInsightSnapshotService $snapshots,
    ) {}

    public function history(Request $request)
    {
        $school = $this->context->currentSchool($request->user());
        abort_unless($school, 403, 'Select a school before opening insights history.');

        return response()->json([
            'data' => \App\Models\SchoolInsightSnapshot::query()
                ->where('school_id', $school->id)
                ->when($request->filled('period_days'), fn ($query) => $query->where('period_days', min(max($request->integer('period_days'), 7), 365)))
                ->latest('snapshot_date')
                ->paginate(min(max($request->integer('per_page', 30), 1), 100)),
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $school = $this->context->currentSchool($user);
        abort_unless($school, 403, 'Select a school before opening insights.');

        $schoolId = (int) $school->id;
        $periodDays = $request->integer('days', 30);
        $summary = $this->snapshots->metrics($school, $periodDays);
        $from = CarbonImmutable::parse($summary['period']['from'])->startOfDay();
        $previous = $this->snapshots->metrics($school, $periodDays, $from->subDay()->endOfDay());
        $facts = $summary['facts'];
        $attendanceTotal = $facts['attendance_records'];
        $attendancePercentage = $facts['attendance_percentage'];
        $averageScore = $facts['average_published_score'];
        $subjectAverages = $summary['subject_averages'];
        $previousFacts = $previous['facts'];
        $comparison = [
            'previous_period' => $previous['period'],
            'attendance_percentage_delta' => $attendancePercentage !== null && $previousFacts['attendance_percentage'] !== null ? round($attendancePercentage - $previousFacts['attendance_percentage'], 1) : null,
            'average_published_score_delta' => $averageScore !== null && $previousFacts['average_published_score'] !== null ? round($averageScore - $previousFacts['average_published_score'], 1) : null,
            'active_students_delta' => (int) $facts['active_students'] - (int) $previousFacts['active_students'],
        ];

        $warnings = [];
        if ($attendancePercentage !== null && $attendancePercentage < 80) {
            $warnings[] = [
                'severity' => $attendancePercentage < 70 ? 'high' : 'medium',
                'type' => 'attendance',
                'title' => 'Attendance requires attention',
                'message' => "Attendance is {$attendancePercentage}% for the selected period. Review affected classes and learners before deciding on an intervention.",
            ];
        }
        if ($averageScore !== null && $averageScore < 50) {
            $warnings[] = [
                'severity' => 'medium',
                'type' => 'academic',
                'title' => 'Published performance is below target',
                'message' => "The average published score is {$averageScore}%. Review the weakest subjects and confirm that all approved results are included.",
            ];
        }
        if ($attendanceTotal === 0) {
            $warnings[] = [
                'severity' => 'info',
                'type' => 'data_quality',
                'title' => 'No attendance records in this period',
                'message' => 'This is a data-availability notice, not a prediction. Confirm that attendance has been recorded for the selected dates.',
            ];
        }
        if ((int) $facts['published_result_count'] === 0) {
            $warnings[] = [
                'severity' => 'info',
                'type' => 'data_quality',
                'title' => 'No published results available',
                'message' => 'Only approved and published results are used here. Complete the result workflow before interpreting academic trends.',
            ];
        }

        $persistedAlerts = $this->alerts->sync($schoolId, $from->toDateString(), $warnings);

        return response()->json([
            'data' => [
                'school' => ['id' => $school->id, 'name' => $school->name],
                'period' => $summary['period'],
                'facts' => [
                    'active_students' => $facts['active_students'],
                    'attendance_percentage' => $attendancePercentage,
                    'attendance_records' => $attendanceTotal,
                    'published_result_count' => $facts['published_result_count'],
                    'average_published_score' => $averageScore,
                ],
                'subject_averages' => $subjectAverages,
                'comparison' => $comparison,
                'warnings' => $warnings,
                'alerts' => $persistedAlerts->map(fn ($alert) => [
                    'id' => $alert->id,
                    'type' => $alert->type,
                    'severity' => $alert->severity,
                    'title' => $alert->title,
                    'message' => $alert->message,
                    'status' => $alert->status,
                ])->values(),
                'is_forecast' => false,
                'disclaimer' => 'These are explainable summaries of records already stored in this school. They are not predictions and do not replace professional academic, pastoral, medical, or financial judgement.',
            ],
        ]);
    }
}
