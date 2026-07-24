<?php

namespace App\Services\Academic;

use App\Models\GradingSystem;

class GradeService
{
    /**
     * Get grading rule for a score.
     */
    public function getGradeRule(
        int $schoolId,
        float $score
    ): ?GradingSystem {

        return GradingSystem::findGrade(
            $schoolId,
            $score
        );
    }

    /**
     * Get grade.
     */
    public function getGrade(
        int $schoolId,
        float $score
    ): string {

        $rule = $this->getGradeRule(
            $schoolId,
            $score
        );

        return $rule?->grade ?? 'N/A';
    }

    /**
     * Get remark.
     */
    public function getRemark(
        int $schoolId,
        float $score
    ): string {

        $rule = $this->getGradeRule(
            $schoolId,
            $score
        );

        return $rule?->remark ?? 'No Remark';
    }

    /**
     * Get grade point.
     */
    public function getGradePoint(
        int $schoolId,
        float $score
    ): float {

        $rule = $this->getGradeRule(
            $schoolId,
            $score
        );

        return (float) ($rule?->grade_point ?? 0);
    }
}
