<?php

namespace App\Services\Academic;

use App\Models\Result;
use Illuminate\Validation\ValidationException;

class AssessmentComputationService
{
    /**
     * Calculate a component's contribution to the normalized 100-point result.
     */
    public function calculateWeightedScore(
        float $score,
        float $maximumMarks,
        float $percentage
    ): float {
        if ($maximumMarks <= 0) {
            throw ValidationException::withMessages([
                'assessment_structure' => 'Every assessment structure must have maximum marks greater than zero.',
            ]);
        }

        if ($percentage < 0 || $percentage > 100) {
            throw ValidationException::withMessages([
                'assessment_structure' => 'Assessment structure percentages must be between 0 and 100.',
            ]);
        }

        if ($score < 0 || $score > $maximumMarks) {
            throw ValidationException::withMessages([
                'score' => "A score must be between 0 and {$maximumMarks}.",
            ]);
        }

        return round(($score / $maximumMarks) * $percentage, 2);
    }

    /**
     * Compute all component weights for one school-scoped result.
     */
    public function computeComponents(Result $result): void
    {
        $result->loadMissing('components.assessmentStructure');

        foreach ($result->components as $component) {
            $structure = $component->assessmentStructure;

            if (!$structure || (int) $structure->school_id !== (int) $result->school_id) {
                throw ValidationException::withMessages([
                    'assessment_structure' => 'A result component references an invalid assessment structure for this school.',
                ]);
            }

            $component->weighted_score = $this->calculateWeightedScore(
                (float) $component->score,
                (float) $structure->maximum_marks,
                (float) $structure->percentage
            );
            $component->save();
        }
    }

    /**
     * Compute the normalized subject total for one school-scoped result.
     */
    public function computeSubjectTotal(Result $result): float
    {
        return round((float) $result->components()->sum('weighted_score'), 2);
    }
}
