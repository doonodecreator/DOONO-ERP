<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResultSubmission;
use App\Services\Academic\ResultSubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultSubmissionController extends Controller
{
    public function __construct(
        protected ResultSubmissionService $submissionService
    ) {
    }

    /**
     * Create a new result submission.
     */
    public function createSubmission(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'integer'],
            'class_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'academic_session_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'created_by' => ['required', 'integer'],
        ]);

        $submission = $this->submissionService->create($validated);

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
    public function loadSubmission(ResultSubmission $submission): JsonResponse
    {
        return response()->json([
            'success' => true,
            'submission' => $submission,
        ]);
    }

    /**
     * Autosave.
     */
    public function autoSave(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Autosave implementation comes next.',
        ]);
    }

    /**
     * Submit for approval.
     */
    public function submit(ResultSubmission $submission): JsonResponse
    {
        $submission = $this->submissionService
            ->submit($submission);

        return response()->json([
            'success' => true,
            'submission' => $submission,
        ]);
    }

    /**
     * Approve submission.
     */
    public function approve(
        Request $request,
        ResultSubmission $submission
    ): JsonResponse {

        $submission = $this->submissionService->approve(
            $submission,
            $request->integer('approved_by'),
            $request->input('approval_note')
        );

        return response()->json([
            'success' => true,
            'submission' => $submission,
        ]);
    }

    /**
     * Publish results.
     */
    public function publish(ResultSubmission $submission): JsonResponse
    {
        $submission = $this->submissionService
            ->publish($submission);

        return response()->json([
            'success' => true,
            'submission' => $submission,
        ]);
    }

    /**
     * Reopen submission.
     */
    public function reopen(ResultSubmission $submission): JsonResponse
    {
        $submission = $this->submissionService
            ->reopen($submission);

        return response()->json([
            'success' => true,
            'submission' => $submission,
        ]);
    }

    /**
     * Cancel submission.
     */
    public function cancel(ResultSubmission $submission): JsonResponse
    {
        $this->submissionService->cancel($submission);

        return response()->json([
            'success' => true,
            'message' => 'Submission cancelled successfully.',
        ]);
    }
}
