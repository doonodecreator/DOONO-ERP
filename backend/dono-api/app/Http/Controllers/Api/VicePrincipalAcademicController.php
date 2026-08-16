<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Examination;
use App\Models\Result;
use App\Models\ResultSubmission;
use App\Models\Staff;
use App\Models\Subject;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class VicePrincipalAcademicController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $school = $this->context->currentSchool($user);

        abort_unless($school, 409, 'No active school.');

        $schoolId = (int) $school->id;
        $staffMember = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        $currentSession = AcademicSession::query()
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        $currentTerm = $currentSession
            ? $currentSession->terms()->where('is_current', true)->first()
            : null;

        $totalSubjects = Subject::query()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->count();

        $activeTeachers = Staff::query()
            ->where('school_id', $schoolId)
            ->where('employment_status', 'Active')
            ->count();

        $submissionQuery = ResultSubmission::query()
            ->where('school_id', $schoolId);
        $submissionCount = (clone $submissionQuery)->count();
        $completedSubmissionCount = (clone $submissionQuery)
            ->whereIn('status', ['submitted', 'approved', 'published'])
            ->count();
        $caSubmissionPercentage = $submissionCount > 0
            ? round(($completedSubmissionCount / $submissionCount) * 100)
            : null;

        $pendingResultsReview = (clone $submissionQuery)
            ->where('status', 'submitted')
            ->count();

        $pendingRawResults = Result::query()
            ->where('school_id', $schoolId)
            ->where(function ($query) {
                $query->where('is_published', false)
                    ->orWhereNull('is_published')
                    ->orWhere('status', '!=', 'published')
                    ->orWhereNull('status');
            })
            ->count();

        $subjectAssignments = Subject::query()
            ->with(['classes:id,name'])
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(12)
            ->get(['id', 'name'])
            ->map(fn (Subject $subject) => [
                'subject' => $subject->name,
                'classes' => $subject->classes->pluck('name')->filter()->implode(', ') ?: 'No classes linked',
                'assigned_teacher' => null,
                'status' => 'Teacher allocation unavailable',
            ])
            ->values();

        $upcomingExams = Examination::query()
            ->where('school_id', $schoolId)
            ->whereDate('start_date', '>=', today())
            ->orderBy('start_date')
            ->limit(10)
            ->get(['id', 'name', 'exam_type', 'start_date', 'status'])
            ->map(fn (Examination $exam) => [
                'id' => $exam->id,
                'title' => $exam->name,
                'exam_type' => $exam->exam_type,
                'start_date' => $exam->start_date?->toDateString(),
                'status' => $exam->status,
            ])
            ->values();

        return response()->json([
            'academic_info' => [
                'vp_name' => $staffMember?->full_name,
                'school_name' => $school->name,
                'session' => $currentSession?->name,
                'term' => $currentTerm?->name,
            ],
            'metrics' => [
                'total_subjects' => $totalSubjects,
                'active_teachers' => $activeTeachers,
                'ca_submissions_pct' => $caSubmissionPercentage,
                'cbt_questions_count' => null,
                'pending_results_review' => $pendingResultsReview,
                'pending_raw_results' => $pendingRawResults,
            ],
            'subject_assignments' => $subjectAssignments,
            'exam_schedule_summary' => $upcomingExams,
        ]);
    }
}
