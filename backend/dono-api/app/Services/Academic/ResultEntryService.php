<?php

namespace App\Services\Academic;

use App\Models\AssessmentStructure;
use App\Models\Result;
use App\Models\ResultComponent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
            $componentPayload = collect($data['components'] ?? []);
            $structureIds = $componentPayload->pluck('assessment_structure_id')->map(fn ($id) => (int) $id);

            if ($structureIds->isEmpty() || $structureIds->count() !== $structureIds->unique()->count()) {
                throw ValidationException::withMessages([
                    'components' => 'Each assessment structure must appear exactly once in a result sheet.',
                ]);
            }

            $structures = AssessmentStructure::query()
                ->where('school_id', $data['school_id'])
                ->where('is_active', true)
                ->whereIn('id', $structureIds->unique())
                ->get()
                ->keyBy('id');

            if ($structures->count() !== $structureIds->unique()->count()) {
                throw ValidationException::withMessages([
                    'components' => 'One or more assessment structures do not belong to the active school or are inactive.',
                ]);
            }

            $identity = [
                'school_id' => $data['school_id'],
                'student_enrollment_id' => $data['student_enrollment_id'],
                'subject_id' => $data['subject_id'],
                'academic_session_id' => $data['academic_session_id'],
                'term_id' => $data['term_id'],
            ];
            $existing = Result::query()->where($identity)->first();

            if ($existing && ($existing->is_published || $existing->locked_at)) {
                throw ValidationException::withMessages([
                    'result' => 'This result is locked and cannot be edited until the submission is reopened.',
                ]);
            }

            $result = $existing ?: new Result($identity);
            $result->fill([
                'result_submission_id' => $data['result_submission_id'] ?? null,
                'status' => 'in_progress',
                'is_published' => false,
                'published_at' => null,
                'published_by' => null,
                'locked_at' => null,
            ]);
            $result->save();

            foreach ($componentPayload as $component) {
                $structure = $structures->get((int) $component['assessment_structure_id']);
                $score = (float) $component['score'];
                $this->assessmentService->calculateWeightedScore(
                    $score,
                    (float) $structure->maximum_marks,
                    (float) $structure->percentage
                );

                ResultComponent::updateOrCreate(
                    [
                        'result_id' => $result->id,
                        'assessment_structure_id' => $structure->id,
                    ],
                    ['score' => $score]
                );
            }

            if (($data['replace_components'] ?? true) === true) {
                ResultComponent::query()
                    ->where('result_id', $result->id)
                    ->whereNotIn('assessment_structure_id', $structureIds->unique())
                    ->delete();
            }

            $this->processingService->process($result->fresh());
            $this->processingService->rebuildStudentSummary(
                $result->student_enrollment_id,
                $result->academic_session_id,
                $result->term_id
            );

            return $result->fresh('components.assessmentStructure');
        });
    }

    /**
     * Save or update an entire class marksheet in a single transaction.
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
