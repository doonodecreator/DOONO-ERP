<?php

namespace App\Services\Academic;

use App\Models\AcademicConfiguration;

class PromotionService
{
    /**
     * Determine promotion status.
     */
    public function determinePromotion(
        int $schoolId,
        float $average,
        int $failedSubjects,
        bool $isFinalTerm = true
    ): array {

        $config = AcademicConfiguration::where(
            'school_id',
            $schoolId
        )->first();

        if (!$config) {

            return [
                'status' => 'Configuration Missing',
                'promoted' => false,
            ];
        }

        if (
            $config->promote_final_term_only &&
            !$isFinalTerm
        ) {

            return [
                'status' => 'Promotion Pending',
                'promoted' => false,
            ];
        }

        if (
            $average >= $config->promotion_pass_mark &&
            $failedSubjects <= 3
        ) {

            return [
                'status' => 'Promoted',
                'promoted' => true,
            ];
        }

        return [
            'status' => 'Repeat',
            'promoted' => false,
        ];
    }

    /**
     * Principal override.
     */
    public function overridePromotion(
        bool $decision,
        string $reason
    ): array {

        return [
            'promoted' => $decision,
            'override_reason' => $reason,
            'overridden' => true,
        ];
    }
}
