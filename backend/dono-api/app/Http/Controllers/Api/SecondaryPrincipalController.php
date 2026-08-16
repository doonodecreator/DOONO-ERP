<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\Division;
use App\Models\ResultSubmission;
use App\Models\Staff;
use App\Models\StudentEnrollment;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class SecondaryPrincipalController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $school = $this->context->currentSchool($request->user());
        abort_unless($school, 409, 'No active school.');

        $schoolId = (int) $school->id;
        $divisionIds = $this->divisionIds($schoolId, ['secondary', 'jss', 'sss', 'senior', 'junior']);
        $session = AcademicSession::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();
        $term = $session?->terms()->where('is_current', true)->first();
        $staffMember = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->first();

        $classes = ClassModel::query()
            ->whereIn('division_id', $divisionIds ?: [-1])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'division_id']);
        $classIds = $classes->pluck('id')->all() ?: [-1];
        $enrollmentQuery = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->when($session, fn ($query) => $query->where('academic_session_id', $session->id))
            ->whereIn('division_id', $divisionIds ?: [-1]);
        $submissions = ResultSubmission::query()
            ->with('subject:id,name')
            ->where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->latest()
            ->limit(8)
            ->get(['id', 'class_id', 'subject_id', 'status', 'created_at']);
        $classNames = $classes->pluck('name', 'id');

        return response()->json([
            'principal_summary' => [
                'principal_name' => $staffMember?->full_name,
                'school_name' => $school->name,
                'session' => $session?->name,
                'term' => $term?->name,
            ],
            'metrics' => [
                'total_students' => $enrollmentQuery->count(),
                'total_teachers' => Staff::query()
                    ->where('school_id', $schoolId)
                    ->where('employment_status', 'Active')
                    ->where('designation', 'like', '%teacher%')
                    ->count(),
                'active_classes' => $classes->count(),
                'waec_candidates' => null,
                'pending_results_approvals' => ResultSubmission::query()
                    ->where('school_id', $schoolId)
                    ->whereIn('class_id', $classIds)
                    ->where('status', 'submitted')
                    ->count(),
            ],
            'streams' => $this->streamSummary($schoolId, $divisionIds, $session?->id),
            'external_exams_status' => [],
            'external_exams_available' => false,
            'external_exams_message' => 'WAEC, NECO, and UTME integrations are not registered in the current backend, so no external-exam status is fabricated.',
            'recent_results' => $submissions->map(fn (ResultSubmission $submission) => [
                'id' => $submission->id,
                'class' => $classNames[$submission->class_id] ?? 'Class unavailable',
                'type' => $submission->subject?->name ?? 'Result submission',
                'status' => $submission->status,
                'date' => $submission->created_at?->toDateString(),
            ])->values(),
            'attendance_rate' => $this->attendanceRate($schoolId, $divisionIds, $session?->id),
        ]);
    }

    private function divisionIds(int $schoolId, array $keywords): array
    {
        return Division::query()
            ->where('school_id', $schoolId)
            ->where(function ($query) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $query->orWhere('name', 'like', "%{$keyword}%")
                        ->orWhere('code', 'like', "%{$keyword}%");
                }
            })
            ->pluck('id')
            ->all();
    }

    private function streamSummary(int $schoolId, array $divisionIds, ?int $sessionId): array
    {
        $rows = StudentEnrollment::query()
            ->with('stream:id,name')
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->when($sessionId, fn ($query) => $query->where('academic_session_id', $sessionId))
            ->whereIn('division_id', $divisionIds ?: [-1])
            ->whereNotNull('stream_id')
            ->selectRaw('stream_id, COUNT(*) as student_count')
            ->groupBy('stream_id')
            ->get();

        return $rows->map(fn (StudentEnrollment $row) => [
            'id' => $row->stream_id,
            'name' => $row->stream?->name ?? 'Stream unavailable',
            'classes_count' => null,
            'stream_head' => null,
            'students' => (int) $row->student_count,
        ])->values()->all();
    }

    private function attendanceRate(int $schoolId, array $divisionIds, ?int $sessionId): ?int
    {
        $query = Attendance::query()
            ->where('school_id', $schoolId)
            ->whereDate('attendance_date', today())
            ->whereHas('studentEnrollment', function ($enrollment) use ($divisionIds, $sessionId) {
                $enrollment
                    ->where('status', 'Active')
                    ->when($sessionId, fn ($query) => $query->where('academic_session_id', $sessionId))
                    ->whereIn('division_id', $divisionIds ?: [-1]);
            });
        $total = (clone $query)->count();

        if ($total === 0) {
            return null;
        }

        $present = (clone $query)
            ->whereRaw("LOWER(status) = 'present'")
            ->count();

        return (int) round(($present / $total) * 100);
    }
}
