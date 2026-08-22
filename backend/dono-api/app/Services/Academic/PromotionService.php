<?php

namespace App\Services\Academic;

use App\Models\AcademicConfiguration;
use App\Models\StudentEnrollment;
use App\Models\StudentPromotion;
use Illuminate\Support\Facades\DB;

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
        $config = AcademicConfiguration::where('school_id', $schoolId)->first();

        if (! $config) {
            return [
                'status' => 'Configuration Missing',
                'promoted' => false,
            ];
        }

        if (!$config->automatic_promotion) {
            return [
                'status' => 'Promotion Pending',
                'promoted' => false,
            ];
        }

        if ($config->promote_final_term_only && ! $isFinalTerm) {
            return [
                'status' => 'Promotion Pending',
                'promoted' => false,
            ];
        }

        $maxFailed = $config->max_failed_subjects_allowed ?? 3;

        if ($average >= $config->promotion_pass_mark && $failedSubjects <= $maxFailed) {
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
     * Execute promotion and create student enrollment in the new academic session.
     */
    public function executePromotion(
        StudentEnrollment $currentEnrollment,
        int $targetSessionId,
        int $targetClassId,
        string $status, // 'Promoted', 'Repeat', 'Graduated'
        ?string $remarks = null,
        ?int $promotedByUserId = null
    ): StudentPromotion {
        return DB::transaction(function () use (
            $currentEnrollment,
            $targetSessionId,
            $targetClassId,
            $status,
            $remarks,
            $promotedByUserId
        ) {
            // 1. Record the promotion transaction log
            $promotion = StudentPromotion::create([
                'school_id' => $currentEnrollment->school_id,
                'student_id' => $currentEnrollment->student_id,
                'from_session_id' => $currentEnrollment->academic_session_id,
                'to_session_id' => $targetSessionId,
                'from_class_id' => $currentEnrollment->class_id,
                'to_class_id' => $targetClassId,
                'status' => $status,
                'remarks' => $remarks,
                'promoted_by' => $promotedByUserId,
            ]);

            // 2. Create the new Enrollment record if not graduating
            if ($status !== 'Graduated') {
                StudentEnrollment::firstOrCreate([
                    'school_id' => $currentEnrollment->school_id,
                    'student_id' => $currentEnrollment->student_id,
                    'academic_session_id' => $targetSessionId,
                ], [
                    'class_id' => $targetClassId,
                    'status' => 'Active',
                ]);
            }

            return $promotion;
        });
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
