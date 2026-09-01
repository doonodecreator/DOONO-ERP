<?php

namespace App\Services\Academic;

use App\Models\Result;
use App\Models\ResultSubmission;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\ActivityLogService;

class ResultSubmissionService
{
    public function __construct(
        protected ResultProcessingService $processingService
    ) {
    }

    /**
     * Create a new submission.
     */
    public function create(array $data): ResultSubmission
    {
        return ResultSubmission::firstOrCreate(
            [
                'school_id' => $data['school_id'],
                'class_id' => $data['class_id'],
                'subject_id' => $data['subject_id'],
                'academic_session_id' => $data['academic_session_id'],
                'term_id' => $data['term_id'],
            ],
            [
                'created_by' => $data['created_by'],
                'status' => 'draft',
            ],
        );
    }

    /**
     * Create draft results for every student in the class.
     */
    public function createDraftResults(ResultSubmission $submission): Collection
    {
        $students = StudentEnrollment::where('school_id', $submission->school_id)
            ->where('class_id', $submission->class_id)
            ->where('academic_session_id', $submission->academic_session_id)
            ->where('term_id', $submission->term_id)
            ->where('status', 'Active')
            ->get();

        foreach ($students as $student) {
            Result::firstOrCreate(
                [
                    'result_submission_id' => $submission->id,
                    'student_enrollment_id' => $student->id,
                    'subject_id' => $submission->subject_id,
                    'academic_session_id' => $submission->academic_session_id,
                    'term_id' => $submission->term_id,
                ],
                [
                    'school_id' => $submission->school_id,
                    'ca_score' => 0,
                    'exam_score' => 0,
                    'total_score' => 0,
                    'grade' => '',
                    'remark' => '',
                    'status' => 'draft',
                    'is_published' => false,
                ]
            );
        }

        return Result::with(['studentEnrollment.student', 'components'])
            ->where('result_submission_id', $submission->id)
            ->orderBy('student_enrollment_id')
            ->get();
    }

    /**
     * Mark submission as in progress.
     */
    public function start(ResultSubmission $submission): ResultSubmission
    {
        $submission->update(['status' => 'in_progress']);

        Result::where('result_submission_id', $submission->id)
            ->update(['status' => 'in_progress']);

        return $submission;
    }

    /**
     * Submit for approval.
     */
    public function submit(ResultSubmission $submission): ResultSubmission
    {
        $submission->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Result::where('result_submission_id', $submission->id)
            ->update(['status' => 'submitted']);

        return $submission;
    }

    /**
     * Approve a submission and lock associated student results.
     */
    public function approve(
        ResultSubmission $submission,
        int $approvedBy,
        ?string $note = null
    ): ResultSubmission {
        return DB::transaction(function () use ($submission, $approvedBy, $note) {
            $submission->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
                'approval_note' => $note,
            ]);

            Result::where('result_submission_id', $submission->id)
                ->update([
                    'status' => 'approved',
                    'approved_by' => $approvedBy,
                    'approved_at' => now(),
                    'locked_at' => now(),
                ]);

            $this->summaryQuery($submission)->update(['approved_by' => $approvedBy, 'approved_at' => now()]);

            return $submission;
        });
    }

    /**
     * Publish results making them visible on student and parent portals.
     */
    public function publish(
        ResultSubmission $submission,
        ?int $publishedBy = null
    ): ResultSubmission {
        return DB::transaction(function () use ($submission, $publishedBy) {
            $now = now();

            $submission->update([
                'status' => 'published',
                'published_at' => $now,
            ]);

            Result::where('result_submission_id', $submission->id)
                ->update([
                    'status' => 'published',
                    'is_published' => true,
                    'published_by' => $publishedBy ?? $submission->approved_by,
                    'published_at' => $now,
                ]);

            $this->summaryQuery($submission)->update(['is_published' => true, 'published_at' => $now]);
            $this->processingService->syncReportCardsForSubmission($submission);

            return $submission;
        });
    }

    /**
     * Reopen for correction (unlocks records).
     */
    public function reopen(ResultSubmission $submission, string $reason, ?int $reopenedBy = null): ResultSubmission
    {
        return DB::transaction(function () use ($submission, $reason, $reopenedBy) {
            $before = [
                'status' => $submission->status,
                'approved_by' => $submission->approved_by,
                'approved_at' => $submission->approved_at?->toIso8601String(),
                'published_at' => $submission->published_at?->toIso8601String(),
                'result_status_counts' => Result::where('result_submission_id', $submission->id)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status')->all(),
            ];
            $now = now();
            $submission->update([
                'status' => 'draft',
                'approved_by' => null,
                'approved_at' => null,
                'published_at' => null,
                'reopen_reason' => $reason,
                'reopened_by' => $reopenedBy,
                'reopened_at' => $now,
            ]);

            Result::where('result_submission_id', $submission->id)
                ->update([
                    'status' => 'draft',
                    'is_published' => false,
                    'approved_by' => null,
                    'approved_at' => null,
                    'published_at' => null,
                    'locked_at' => null,
                ]);

            $this->summaryQuery($submission)->update(['is_published' => false, 'published_at' => null, 'approved_by' => null, 'approved_at' => null]);
            $this->processingService->syncReportCardsForSubmission($submission);

            ActivityLogService::log(
                module: 'results',
                action: 'reopened',
                description: 'A result submission was reopened for controlled correction.',
                subject: $submission,
                properties: [
                    'reason' => $reason,
                    'before' => $before,
                    'after' => [
                        'status' => 'draft',
                        'approved_by' => null,
                        'approved_at' => null,
                        'published_at' => null,
                        'reopened_by' => $reopenedBy,
                        'reopened_at' => $now->toIso8601String(),
                        'result_status' => 'draft',
                    ],
                ],
                schoolId: $submission->school_id,
            );

            return $submission;
        });
    }

    private function summaryQuery(ResultSubmission $submission)
    {
        $enrollmentIds = Result::where('result_submission_id', $submission->id)->pluck('student_enrollment_id');
        return StudentResultSummary::where('school_id', $submission->school_id)
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->where('academic_session_id', $submission->academic_session_id)
            ->where('term_id', $submission->term_id);
    }

    /**
     * Cancel a draft submission.
     */
    public function cancel(ResultSubmission $submission): ResultSubmission
    {
        return DB::transaction(function () use ($submission) {
            Result::where('result_submission_id', $submission->id)->delete();
            $submission->delete();

            return $submission;
        });
    }
}
