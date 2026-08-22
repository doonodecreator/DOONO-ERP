<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResultSubmission;
use App\Models\AcademicSession;
use App\Models\AssessmentStructure;
use App\Models\ClassModel;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Term;
use App\Models\CbtAssessment;
use App\Services\Academic\ResultEntryService;
use App\Services\Academic\ResultSubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultSubmissionController extends Controller
{
    public function __construct(
        protected ResultSubmissionService $submissionService,
        protected ResultEntryService $resultEntryService
    ) {
    }

    private function scoped(Request $request, ResultSubmission $submission): ResultSubmission
    {
        abort_unless((int) $submission->school_id === $this->requireSchool($request), 404, 'Result submission not found.');
        return $submission->load(['class:id,name', 'subject:id,name', 'academicSession:id,name', 'term:id,name', 'creator:id,name', 'approver:id,name']);
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ResultSubmission::where('school_id', $this->requireSchool($request))
                ->with(['class:id,name', 'subject:id,name', 'academicSession:id,name', 'term:id,name', 'creator:id,name', 'approver:id,name'])
                ->latest()
                ->paginate(min(max($request->integer('per_page', 30), 1), 100)),
        ]);
    }

    /**
     * Create a new result submission.
     */
    public function createSubmission(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'term_id' => ['required', 'integer', 'exists:terms,id'],
        ]);

        $schoolId = $this->requireSchool($request);
        abort_unless(ClassModel::whereKey($validated['class_id'])->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected class does not belong to the active school.');
        abort_unless(Subject::whereKey($validated['subject_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected subject does not belong to the active school.');
        abort_unless(AcademicSession::whereKey($validated['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected academic session does not belong to the active school.');
        abort_unless(Term::whereKey($validated['term_id'])->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId)->whereKey($validated['academic_session_id']))->exists(), 422, 'The selected term does not belong to the active school session.');

        $submission = $this->submissionService->create([
            ...$validated,
            'school_id' => $schoolId,
            'created_by' => $request->user()->id,
        ]);

        $results = $this->submissionService
            ->createDraftResults($submission);

        return response()->json([
            'success' => true,
            'message' => 'Result submission created successfully.',
            'submission' => $submission,
            'results' => $results,
        ], 201);
    }

    /**
     * Load an existing submission.
     */
    public function loadSubmission(Request $request, ResultSubmission $submission): JsonResponse
    {
        return response()->json([
            'success' => true,
            'submission' => $this->scoped($request, $submission),
        ]);
    }

    /**
     * Autosave.
     */
    public function autoSave(Request $request, ResultSubmission $submission): JsonResponse
    {
        $submission = $this->scoped($request, $submission);
        abort_unless(in_array($submission->status, ['draft', 'in_progress'], true), 422, 'Only draft or in-progress submissions can be autosaved.');
        $validated = $request->validate([
            'students' => ['required', 'array', 'min:1'],
            'students.*.student_enrollment_id' => ['required', 'integer', 'exists:student_enrollments,id'],
            'students.*.components' => ['required', 'array'],
            'students.*.components.*.assessment_structure_id' => ['required', 'integer', 'exists:assessment_structures,id'],
            'students.*.components.*.score' => ['required', 'numeric', 'min:0'],
        ]);
        $enrollmentIds = collect($validated['students'])->pluck('student_enrollment_id')->unique();
        abort_unless(StudentEnrollment::where('school_id', $submission->school_id)->where('class_id', $submission->class_id)->whereIn('id', $enrollmentIds)->where('status', 'Active')->count() === $enrollmentIds->count(), 422, 'One or more students do not belong to this result submission.');
        $structureIds = collect($validated['students'])->flatMap(fn ($student) => collect($student['components'])->pluck('assessment_structure_id'))->unique();
        abort_unless(AssessmentStructure::where('school_id', $submission->school_id)->whereIn('id', $structureIds)->where('is_active', true)->count() === $structureIds->count(), 422, 'One or more assessment structures do not belong to the active school.');
        $this->submissionService->start($submission);
        $saved = [];
        foreach ($validated['students'] as $student) {
            $saved[] = $this->resultEntryService->saveStudentResult([
                'school_id' => $submission->school_id,
                'subject_id' => $submission->subject_id,
                'academic_session_id' => $submission->academic_session_id,
                'term_id' => $submission->term_id,
                'result_submission_id' => $submission->id,
                'student_enrollment_id' => $student['student_enrollment_id'],
                'components' => $student['components'],
            ]);
        }
        return response()->json(['success' => true, 'message' => count($saved).' student result(s) autosaved.', 'data' => $saved]);
    }

    /**
     * Submit for approval.
     */
    public function submit(Request $request, ResultSubmission $submission): JsonResponse
    {
        $submission = $this->scoped($request, $submission);
        abort_unless(in_array($submission->status, ['draft', 'in_progress'], true), 422, 'Only draft or in-progress submissions can be submitted.');
        $updated = $this->submissionService->submit($submission);

        return response()->json(['success' => true, 'message' => 'Result submission sent for approval.', 'submission' => $this->scoped($request, $updated)]);
    }

    /**
     * Approve submission.
     */
    public function approve(
        Request $request,
        ResultSubmission $submission
    ): JsonResponse {
        $submission = $this->scoped($request, $submission);
        abort_unless($submission->status === 'submitted', 422, 'Only submitted results can be approved.');
        $submission = $this->submissionService->approve($submission, $request->user()->id, $request->input('approval_note'));
        CbtAssessment::where('result_submission_id', $submission->id)->update(['results_status' => 'approved', 'results_reviewed_by' => $request->user()->id, 'results_reviewed_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Result submission approved.', 'submission' => $this->scoped($request, $submission)]);
    }

    /**
     * Publish results.
     */
    public function publish(Request $request, ResultSubmission $submission): JsonResponse
    {
        $submission = $this->scoped($request, $submission);
        abort_unless(in_array($submission->status, ['approved', 'published'], true), 422, 'Only approved results can be published.');
        $updated = $this->submissionService->publish($submission, $request->user()->id);
        CbtAssessment::where('result_submission_id', $updated->id)->update(['results_status' => 'published', 'results_published_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Results published to student and parent portals.', 'submission' => $this->scoped($request, $updated)]);
    }

    /**
     * Reopen submission.
     */
    public function reopen(Request $request, ResultSubmission $submission): JsonResponse
    {
        $submission = $this->scoped($request, $submission);
        abort_unless(in_array($submission->status, ['submitted', 'approved', 'published'], true), 422, 'This submission cannot be reopened.');
        $updated = $this->submissionService->reopen($submission);

        return response()->json(['success' => true, 'message' => 'Result submission reopened for correction.', 'submission' => $this->scoped($request, $updated)]);
    }

    /**
     * Cancel submission.
     */
    public function cancel(Request $request, ResultSubmission $submission): JsonResponse
    {
        $this->submissionService->cancel($this->scoped($request, $submission));

        return response()->json(['success' => true, 'message' => 'Submission cancelled successfully.']);
    }
}
