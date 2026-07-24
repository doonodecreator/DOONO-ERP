<?php

namespace App\Services\Academic;

use App\Models\ResultSubmission;
use App\Models\Result;
use App\Models\StudentEnrollment;
use Illuminate\Support\Collection;

class ResultSubmissionService
{
    /**
     * Create a new submission.
     */
    public function create(array $data): ResultSubmission
    {
        return ResultSubmission::create([
            'school_id' => $data['school_id'],
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'],
            'academic_session_id' => $data['academic_session_id'],
            'term_id' => $data['term_id'],
            'created_by' => $data['created_by'],
            'status' => 'draft',
        ]);
    }

    /**
 * Create draft results for every student in the class.
 */
public function createDraftResults(
    ResultSubmission $submission
): Collection {

    $students = StudentEnrollment::where(
        'class_id',
        $submission->class_id
    )
    ->where(
        'academic_session_id',
        $submission->academic_session_id
    )
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
                'is_published' => false,
            ]
        );
    }

    return Result::with('studentEnrollment.student')
        ->where(
            'result_submission_id',
            $submission->id
        )
        ->orderBy('student_enrollment_id')
        ->get();
}


    /**
     * Mark submission as in progress.
     */
    public function start(ResultSubmission $submission): ResultSubmission
    {
        $submission->update([
            'status' => 'in_progress',
        ]);

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

        return $submission;
    }

    /**
     * Approve a submission.
     */
    public function approve(
        ResultSubmission $submission,
        int $approvedBy,
        ?string $note = null
    ): ResultSubmission {

        $submission->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
            'approval_note' => $note,
        ]);

        return $submission;
    }

    /**
     * Publish results.
     */
    public function publish(ResultSubmission $submission): ResultSubmission
    {
        $submission->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return $submission;
    }

    /**
     * Reopen for correction.
     */
    public function reopen(ResultSubmission $submission): ResultSubmission
    {
        $submission->update([
            'status' => 'draft',
            'approved_by' => null,
            'approved_at' => null,
            'published_at' => null,
        ]);

        return $submission;
    }

    /**
     * Cancel a draft submission.
     */
    public function cancel(ResultSubmission $submission): ResultSubmission
    {
        $submission->delete();

        return $submission;
    }
}
