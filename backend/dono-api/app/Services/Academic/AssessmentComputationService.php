<?php

namespace App\Services\Academic;

use App\Models\AssessmentStructure;
use App\Models\ResultComponent;

class AssessmentComputationService
{
    /**
     * Calculate weighted score.
     */
    public function calculateWeightedScore(
        float $score,
        float $maximumMarks,
        float $percentage
    ): float {

        if ($maximumMarks <= 0) {
            return 0;
        }

        return round(
            ($score / $maximumMarks) * $percentage,
            2
        );
    }

    /**
     * Compute subject total.
     */
    public function computeSubjectTotal(
        int $resultId
    ): float {

        $components = ResultComponent::where(
            'result_id',
            $resultId
        )->get();

        return round(
            $components->sum('weighted_score'),
            2
        );
    }

    /**
     * Calculate every component.
     */
    public function computeComponents(
        int $resultId
    ): void {

        $components = ResultComponent::where(
            'result_id',
            $resultId
        )->get();

        foreach ($components as $component) {

            $structure = AssessmentStructure::find(
                $component->assessment_structure_id
            );

            if (!$structure) {
                continue;
            }

            $component->weighted_score =
                $this->calculateWeightedScore(
                    $component->score,
                    $structure->maximum_marks,
                    $structure->percentage
                );

            $component->save();
        }
    }
}
