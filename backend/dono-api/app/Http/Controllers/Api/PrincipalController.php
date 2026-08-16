<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ResultSubmission;
use App\Models\Staff;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrincipalController extends Controller
{
    public function __construct(
        private CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);
        $school = $this->context->currentSchool($request->user());

        $activeStaff = Staff::query()
            ->where('school_id', $schoolId)
            ->where('employment_status', 'Active');

        $teacherCount = (clone $activeStaff)
            ->where(function ($query) {
                $query
                    ->whereRaw('LOWER(designation) LIKE ?', ['%teacher%'])
                    ->orWhereRaw('LOWER(designation) LIKE ?', ['%form_teacher%']);
            })
            ->count();

        $pendingResultSubmissions = ResultSubmission::query()
            ->with(['class', 'subject', 'creator'])
            ->where('school_id', $schoolId)
            ->whereNotNull('submitted_at')
            ->whereNull('approved_at');

        $attendanceRecords = Attendance::query()
            ->where('school_id', $schoolId)
            ->whereDate('attendance_date', '>=', now()->subDays(30)->toDateString());
        $attendanceTotal = (clone $attendanceRecords)->count();
        $attendancePresent = (clone $attendanceRecords)
            ->whereRaw('LOWER(status) = ?', ['present'])
            ->count();

        $attendanceRate = $attendanceTotal > 0
            ? number_format(($attendancePresent / $attendanceTotal) * 100, 1) . '%'
            : '0%';

        $departments = (clone $activeStaff)
            ->select([
                'department',
                DB::raw('COUNT(*) as count'),
            ])
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->groupBy('department')
            ->orderByDesc('count')
            ->get()
            ->map(fn (Staff $staff) => [
                'department' => $staff->department,
                'count' => (int) $staff->count,
                'head' => null,
            ])
            ->values();

        return response()->json([
            'school_summary' => [
                'school_name' => $school?->name,
                'principal_name' => $request->user()->name,
                'academic_session' => null,
                'term' => null,
            ],
            'metrics' => [
                'total_teachers' => $teacherCount,
                'total_students' => Student::query()
                    ->where('school_id', $schoolId)
                    ->whereRaw('LOWER(status) = ?', ['active'])
                    ->count(),
                // The current API exposes admission creation, but no pending-admission state.
                'pending_admissions' => null,
                'pending_results_approval' => (clone $pendingResultSubmissions)->count(),
                'attendance_rate' => $attendanceRate,
            ],
            'pending_approvals' => $pendingResultSubmissions
                ->latest('submitted_at')
                ->limit(10)
                ->get()
                ->map(fn (ResultSubmission $submission) => [
                    'id' => $submission->id,
                    'type' => 'Approve Results',
                    'details' => collect([
                        optional($submission->class)->name,
                        optional($submission->subject)->name,
                    ])->filter()->implode(' • ') ?: 'Result submission',
                    'submitted_by' => optional($submission->creator)->name ?: 'Unknown user',
                    'date' => $submission->submitted_at?->format('Y-m-d H:i'),
                ])
                ->values(),
            'teacher_stats' => $departments,
            // No announcement resource or route is registered in the current API.
            'recent_announcements' => [],
        ]);
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }
}
