<?php

namespace App\Services\Academic;

use App\Models\AcademicConfiguration;
use App\Models\StudentEnrollment;
use App\Models\StudentPromotion;
use App\Models\ClassModel;
use App\Services\StudentLifecycleService;
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
            'status' => 'Repeated',
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
        string $status, // 'Promoted', 'Repeated', 'Graduated'
        ?string $remarks = null,
        ?int $promotedByUserId = null
    ): StudentPromotion {
        $targetClass = ClassModel::query()
            ->whereKey($targetClassId)
            ->whereHas('division', fn ($query) => $query->where('school_id', $currentEnrollment->school_id))
            ->firstOrFail();

        $normalizedStatus = $status === 'Repeat' ? 'Repeated' : $status;
        if (! in_array($normalizedStatus, ['Promoted', 'Repeated', 'Transferred', 'Graduated'], true)) {
            throw new \InvalidArgumentException('Unsupported student lifecycle status.');
        }

        return app(StudentLifecycleService::class)->applyPromotion([
            'student_id' => $currentEnrollment->student_id,
            'from_academic_session_id' => $currentEnrollment->academic_session_id,
            'to_academic_session_id' => $targetSessionId,
            'from_division_id' => $currentEnrollment->division_id,
            'to_division_id' => $targetClass->division_id,
            'from_class_id' => $currentEnrollment->class_id,
            'to_class_id' => $targetClass->id,
            'from_stream_id' => $currentEnrollment->stream_id,
            'to_stream_id' => null,
            'promotion_date' => now()->toDateString(),
            'promotion_status' => $normalizedStatus,
            'remarks' => $remarks,
        ], (int) $currentEnrollment->school_id, (int) ($promotedByUserId ?? 0))['promotion'];
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
