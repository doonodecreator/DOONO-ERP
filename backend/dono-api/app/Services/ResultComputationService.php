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
        return round($continuousAssessment + $exam, 2);
    }

    /**
     * Get grading rule from database.
     */
    protected function getGradeRule(
        int $schoolId,
        float $score
    ): ?GradingSystem {
        return GradingSystem::findGrade($schoolId, $score);
    }

    /**
     * Calculate grade using school's grading system.
     */
    public function calculateGrade(
        int $schoolId,
        float $score
    ): string {
        $grade = $this->getGradeRule($schoolId, $score);
        return $grade?->grade ?? 'N/A';
    }

    /**
     * Calculate remark using school's grading system.
     */
    public function calculateRemark(
        int $schoolId,
        float $score
    ): string {
        $grade = $this->getGradeRule($schoolId, $score);
        return $grade?->remark ?? 'No Remark';
    }

    /**
     * Calculate average score.
     */
    public function calculateAverage(array $scores): float
    {
        if (count($scores) === 0) {
            return 0;
        }

        return round(array_sum($scores) / count($scores), 2);
    }

    /**
     * Format a numerical position into an ordinal string (e.g. 1 -> 1st, 2 -> 2nd).
     */
    public function formatOrdinal(int $number): string
    {
        if (in_array(($number % 100), [11, 12, 13])) {
            return $number . 'th';
        }

        return match ($number % 10) {
            1 => $number . 'st',
            2 => $number . 'nd',
            3 => $number . 'rd',
            default => $number . 'th',
        };
    }

    /**
     * Calculate positions for a key-value list of [id => score/average].
     * Handles ties correctly using standard competition ranking (1st, 2nd, 2nd, 4th).
     *
     * @param array<int|string, float> $scores Map of entity ID to score
     * @return array<int|string, int> Map of entity ID to numerical rank
     */
    public function calculateRanks(array $scores): array
    {
        arsort($scores);

        $ranks = [];
        $currentRank = 1;
        $previousScore = null;
        $itemsAtScore = 0;

        foreach ($scores as $id => $score) {
            if ($previousScore !== null && $score == $previousScore) {
                $itemsAtScore++;
            } else {
                $currentRank += $itemsAtScore;
                $itemsAtScore = 1;
                $previousScore = $score;
            }

            $ranks[$id] = $currentRank;
        }

        return $ranks;
    }

    /**
     * Build a complete subject result.
     */
    public function computeSubjectResult(
        int $schoolId,
        float $continuousAssessment,
        float $exam
    ): array {
        $total = $this->calculateTotal($continuousAssessment, $exam);

        return [
            'continuous_assessment' => $continuousAssessment,
            'exam' => $exam,
            'total' => $total,
            'grade' => $this->calculateGrade($schoolId, $total),
            'remark' => $this->calculateRemark($schoolId, $total),
        ];
    }

    /**
     * Calculate student's overall result summary across subjects.
     */
    public function calculateStudentResult(
        int $schoolId,
        array $subjectTotals,
        float $passMark = 50.0
    ): array {
        $average = $this->calculateAverage($subjectTotals);
        $totalScore = array_sum($subjectTotals);

        $passed = 0;
        $failed = 0;

        foreach ($subjectTotals as $score) {
            if ($score >= $passMark) {
                $passed++;
            } else {
                $failed++;
            }
        }

        return [
            'total_score' => $totalScore,
            'average' => $average,
            'subjects_offered' => count($subjectTotals),
            'subjects_passed' => $passed,
            'subjects_failed' => $failed,
            'overall_grade' => $this->calculateGrade($schoolId, $average),
            'overall_remark' => $this->calculateRemark($schoolId, $average),
        ];
    }
}
