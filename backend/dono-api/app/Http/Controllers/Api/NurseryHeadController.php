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

class NurseryHeadController extends Controller
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
        $divisionIds = $this->divisionIds($schoolId, [
            'nursery',
            'creche',
            'kg',
            'kindergarten',
            'early',
        ]);
        $session = AcademicSession::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();
        $term = $session?->terms()->where('is_current', true)->first();
        $staffMember = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->first();

        $enrollments = $this->activeEnrollments($schoolId, $divisionIds, $session?->id);
        $classes = ClassModel::query()
            ->whereIn('division_id', $divisionIds ?: [-1])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'division_id']);
        $classPupilCounts = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->when($session, fn ($query) => $query->where('academic_session_id', $session->id))
            ->whereIn('class_id', $classes->pluck('id')->all() ?: [-1])
            ->selectRaw('class_id, COUNT(*) as pupil_count')
            ->groupBy('class_id')
            ->pluck('pupil_count', 'class_id');

        $submissions = ResultSubmission::query()
            ->with('subject:id,name')
            ->where('school_id', $schoolId)
            ->whereIn('class_id', $classes->pluck('id')->all() ?: [-1])
            ->latest()
            ->limit(8)
            ->get(['id', 'class_id', 'subject_id', 'status', 'created_at']);
        $classNames = $classes->pluck('name', 'id');

        return response()->json([
            'nursery_summary' => [
                'head_name' => $staffMember?->full_name,
                'school_name' => $school->name,
                'session' => $session?->name,
                'term' => $term?->name,
            ],
            'metrics' => [
                'total_pupils' => $enrollments->count(),
                'total_teachers' => $this->activeTeacherCount($schoolId),
                'nursery_classes' => $classes->count(),
                'today_attendance_pct' => $this->attendanceRate($schoolId, $divisionIds, $session?->id),
                'pending_assessments' => ResultSubmission::query()
                    ->where('school_id', $schoolId)
                    ->whereIn('class_id', $classes->pluck('id')->all() ?: [-1])
                    ->where('status', 'submitted')
                    ->count(),
            ],
            'classes' => $classes->map(fn (ClassModel $class) => [
                'id' => $class->id,
                'name' => $class->name,
                'teacher' => null,
                'pupils' => (int) ($classPupilCounts[$class->id] ?? 0),
            ])->values(),
            'recent_assessments' => $submissions->map(fn (ResultSubmission $submission) => [
                'id' => $submission->id,
                'title' => $submission->subject?->name ?? 'Assessment submission',
                'class' => $classNames[$submission->class_id] ?? 'Class unavailable',
                'status' => $submission->status,
                'date' => $submission->created_at?->toDateString(),
            ])->values(),
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

    private function activeEnrollments(int $schoolId, array $divisionIds, ?int $sessionId)
    {
        return StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->when($sessionId, fn ($query) => $query->where('academic_session_id', $sessionId))
            ->whereIn('division_id', $divisionIds ?: [-1])
            ->get(['id', 'student_id', 'class_id']);
    }

    private function activeTeacherCount(int $schoolId): int
    {
        return Staff::query()
            ->where('school_id', $schoolId)
            ->where('employment_status', 'Active')
            ->where('designation', 'like', '%teacher%')
            ->count();
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
