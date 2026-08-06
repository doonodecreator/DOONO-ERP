<?php

namespace App\Services\Academic;

use App\Models\Result;
use App\Models\ResultComponent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ResultEntryService
{
    public function __construct(
        protected AssessmentComputationService $assessmentService,
        protected ResultProcessingService $processingService
    ) {
    }

    /**
     * Save or update one student's subject result.
     */
    public function saveStudentResult(array $data): Result
    {
        return DB::transaction(function () use ($data) {
            $result = Result::updateOrCreate(
                [
                    'student_enrollment_id' => $data['student_enrollment_id'],
                    'subject_id' => $data['subject_id'],
                    'academic_session_id' => $data['academic_session_id'],
                    'term_id' => $data['term_id'],
                ],
                [
                    'school_id' => $data['school_id'],
                    'result_submission_id' => $data['result_submission_id'] ?? null,
                    'status' => 'in_progress',
                ]
            );

            if (! empty($data['components'])) {
                foreach ($data['components'] as $component) {
                    ResultComponent::updateOrCreate(
                        [
                            'result_id' => $result->id,
                            'assessment_structure_id' => $component['assessment_structure_id'],
                        ],
                        [
                            'score' => $component['score'],
                        ]
                    );
                }
            }

            $this->processingService->process($result);

            $this->processingService->rebuildStudentSummary(
                $result->student_enrollment_id,
                $result->academic_session_id,
                $result->term_id
            );

            return $result->fresh('components');
        });
    }

    /**
     * Save or update an entire class marksheet in a single batch transaction.
     *
     * @param array $studentsResults Array of student result payloads
     * @return Collection Collection of updated Result models
     */
    public function saveBatchResults(array $studentsResults): Collection
    {
        return DB::transaction(function () use ($studentsResults) {
            $savedResults = collect();

            foreach ($studentsResults as $studentData) {
                $savedResults->push($this->saveStudentResult($studentData));
            }

            return $savedResults;
        });
    }
}
