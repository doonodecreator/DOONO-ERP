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
use App\Models\StudentPromotion;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class PrimaryHeadmasterController extends Controller
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
        $divisionIds = $this->divisionIds($schoolId, ['primary', 'basic']);
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
        $classPupilCounts = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('status', 'Active')
            ->when($session, fn ($query) => $query->where('academic_session_id', $session->id))
            ->whereIn('class_id', $classIds)
            ->selectRaw('class_id, COUNT(*) as pupil_count')
            ->groupBy('class_id')
            ->pluck('pupil_count', 'class_id');
        $submissions = ResultSubmission::query()
            ->with('subject:id,name')
            ->where('school_id', $schoolId)
            ->whereIn('class_id', $classIds)
            ->latest()
            ->limit(8)
            ->get(['id', 'class_id', 'subject_id', 'status', 'created_at']);
        $classNames = $classes->pluck('name', 'id');

        return response()->json([
            'headmaster_summary' => [
                'headmaster_name' => $staffMember?->full_name,
                'school_name' => $school->name,
                'session' => $session?->name,
                'term' => $term?->name,
            ],
            'metrics' => [
                'total_pupils' => StudentEnrollment::query()
                    ->where('school_id', $schoolId)
                    ->where('status', 'Active')
                    ->when($session, fn ($query) => $query->where('academic_session_id', $session->id))
                    ->whereIn('division_id', $divisionIds ?: [-1])
                    ->count(),
                'total_teachers' => $this->activeTeacherCount($schoolId),
                'primary_classes' => $classes->count(),
                'today_attendance_pct' => $this->attendanceRate($schoolId, $divisionIds, $session?->id),
                'pending_promotions' => null,
                'result_submissions_pending_review' => ResultSubmission::query()
                    ->where('school_id', $schoolId)
                    ->whereIn('class_id', $classIds)
                    ->where('status', 'submitted')
                    ->count(),
            ],
            'classes' => $classes->map(fn (ClassModel $class) => [
                'id' => $class->id,
                'name' => $class->name,
                'teacher' => null,
                'pupils' => (int) ($classPupilCounts[$class->id] ?? 0),
            ])->values(),
            'recent_results' => $submissions->map(fn (ResultSubmission $submission) => [
                'id' => $submission->id,
                'class' => $classNames[$submission->class_id] ?? 'Class unavailable',
                'type' => $submission->subject?->name ?? 'Result submission',
                'status' => $submission->status,
                'date' => $submission->created_at?->toDateString(),
            ])->values(),
            'promotion_status' => [
                'available' => true,
                'message' => 'The promotion workflow has no pending approval status; records use Promoted, Repeated, Transferred, or Graduated.',
                'recent_count' => StudentPromotion::query()->where('school_id', $schoolId)->count(),
            ],
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
