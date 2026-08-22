<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResultRequest;
use App\Http\Requests\UpdateResultRequest;
use App\Http\Resources\ResultResource;
use App\Models\Result;
use App\Models\ResultSubmission;
use App\Services\Academic\ResultSubmissionService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly ResultSubmissionService $submissionService
    ) {
    }

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }

    public function index(Request $request)
    {
        $schoolId = $this->currentContextSchoolId($request);
        abort_unless($schoolId, 409, 'Select an active school before viewing results.');

        return ResultResource::collection(
            Result::query()
                ->where('school_id', $schoolId)
                ->with(['school', 'studentEnrollment', 'subject', 'academicSession', 'term'])
                ->latest()
                ->paginate(15)
        );
    }

    public function show(Request $request, Result $result)
    {
        abort_unless((int) $result->school_id === (int) $this->currentContextSchoolId($request), 404, 'Result not found.');

        return new ResultResource($result->load([
            'school',
            'studentEnrollment',
            'subject',
            'academicSession',
            'term',
        ]));
    }

    /**
     * Legacy write endpoints are intentionally disabled. Results must be entered
     * through result-entry and published through result-submissions.
     */
    public function store(StoreResultRequest $request)
    {
        return response()->json([
            'message' => 'Direct result creation is disabled. Use the result-entry submission workflow.',
        ], 410);
    }

    public function update(UpdateResultRequest $request, Result $result)
    {
        return response()->json([
            'message' => 'Direct result editing is disabled. Reopen the result submission and use the result-entry workflow.',
        ], 410);
    }

    public function destroy(Request $request, Result $result)
    {
        return response()->json([
            'message' => 'Direct result deletion is disabled. Cancel or reopen the result submission workflow instead.',
        ], 410);
    }

    /**
     * Compatibility endpoint that delegates to the complete submission workflow.
     */
    public function publish(Request $request, Result $result)
    {
        abort_unless((int) $result->school_id === (int) $this->currentContextSchoolId($request), 404, 'Result not found.');
        abort_unless($result->result_submission_id, 422, 'This result is not attached to an official submission. Publish the complete result submission instead.');

        $submission = ResultSubmission::query()
            ->whereKey($result->result_submission_id)
            ->where('school_id', $result->school_id)
            ->firstOrFail();
        abort_unless(in_array($submission->status, ['approved', 'published'], true), 422, 'Only an approved result submission can be published.');

        $updated = $this->submissionService->publish($submission, $request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'The complete result submission was published successfully.',
            'data' => $updated,
        ]);
    }
}
