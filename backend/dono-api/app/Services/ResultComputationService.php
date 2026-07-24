<?php

namespace App\Services;

use App\Models\GradingSystem;

class ResultComputationService
{
    /**
     * Calculate total score.
     */
    public function calculateTotal(
        float $continuousAssessment,
        float $exam
    ): float {

        return round(
            $continuousAssessment + $exam,
            2
        );
    }

    /**
     * Get grading rule from database.
     */
    protected function getGradeRule(
        int $schoolId,
        float $score
    ): ?GradingSystem {

        return GradingSystem::findGrade(
            $schoolId,
            $score
        );
    }

    /**
     * Calculate grade using school's grading system.
     */
    public function calculateGrade(
        int $schoolId,
        float $score
    ): string {

        $grade = $this->getGradeRule(
            $schoolId,
            $score
        );

        return $grade?->grade ?? 'N/A';
    }

    /**
     * Calculate remark using school's grading system.
     */
    public function calculateRemark(
        int $schoolId,
        float $score
    ): string {

        $grade = $this->getGradeRule(
            $schoolId,
            $score
        );

        return $grade?->remark ?? 'No Remark';
    }

    /**
     * Calculate average score.
     */
    public function calculateAverage(
        array $scores
    ): float {

        if (count($scores) === 0) {
            return 0;
        }

        return round(
            array_sum($scores) / count($scores),
            2
        );
    }

    /**
     * Build a complete subject result.
     */
    public function computeSubjectResult(
        int $schoolId,
        float $continuousAssessment,
        float $exam
    ): array {

        $total = $this->calculateTotal(
            $continuousAssessment,
            $exam
        );

        return [
            'continuous_assessment' => $continuousAssessment,

            'exam' => $exam,

            'total' => $total,

            'grade' => $this->calculateGrade(
                $schoolId,
                $total
            ),

            'remark' => $this->calculateRemark(
                $schoolId,
                $total
            ),
        ];
    }

    /**
     * Calculate student's overall result.
     */
    public function calculateStudentResult(
        int $schoolId,
        array $subjectTotals
    ): array {

        $average = $this->calculateAverage(
            $subjectTotals
        );

        return [
            'total_score' => array_sum($subjectTotals),

            'average' => $average,

            'overall_grade' => $this->calculateGrade(
                $schoolId,
                $average
            ),

            'overall_remark' => $this->calculateRemark(
                $schoolId,
                $average
            ),
        ];
    }
}
