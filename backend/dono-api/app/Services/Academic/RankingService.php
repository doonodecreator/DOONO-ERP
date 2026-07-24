<?php

namespace App\Services\Academic;

class RankingService
{
    /**
     * Rank students using Standard Competition Ranking.
     *
     * Example:
     * 95 = 1st
     * 90 = 2nd
     * 90 = 2nd
     * 85 = 4th
     */
    public function rankStudents(array $students): array
    {
        usort($students, function ($a, $b) {
            return $b['average'] <=> $a['average'];
        });

        $previousAverage = null;
        $position = 0;
        $actualIndex = 0;

        foreach ($students as &$student) {

            $actualIndex++;

            if ($previousAverage === null ||
                $student['average'] != $previousAverage) {

                $position = $actualIndex;
            }

            $student['position'] = $position;

            $previousAverage = $student['average'];
        }

        return $students;
    }

    /**
     * Calculate class average.
     */
    public function calculateClassAverage(
        array $averages
    ): float {

        if (count($averages) === 0) {
            return 0;
        }

        return round(
            array_sum($averages) / count($averages),
            2
        );
    }

    /**
     * Highest average.
     */
    public function highestAverage(
        array $averages
    ): float {

        return empty($averages)
            ? 0
            : max($averages);
    }

    /**
     * Lowest average.
     */
    public function lowestAverage(
        array $averages
    ): float {

        return empty($averages)
            ? 0
            : min($averages);
    }
}
