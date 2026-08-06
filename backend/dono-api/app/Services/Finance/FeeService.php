<?php

namespace App\Services\Finance;

use App\Models\Fee;
use App\Models\StudentEnrollment;
use App\Models\StudentFee;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FeeService
{
    /**
     * Generate student fee invoices for an entire class for a session and term.
     */
    public function generateClassInvoices(
        int $schoolId,
        int $classId,
        int $sessionId,
        int $termId,
        ?string $dueDate = null
    ): Collection {
        return DB::transaction(function () use ($schoolId, $classId, $sessionId, $termId, $dueDate) {
            // Fetch all active fee items configured for this class/term
            $fees = Fee::where('school_id', $schoolId)
                ->where('academic_session_id', $sessionId)
                ->where('term_id', $termId)
                ->where(function ($query) use ($classId) {
                    $query->where('class_id', $classId)
                        ->orWhereNull('class_id');
                })
                ->where('is_active', true)
                ->get();

            if ($fees->isEmpty()) {
                return collect();
            }

            // Fetch active student enrollments for this class
            $enrollments = StudentEnrollment::where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->where('academic_session_id', $sessionId)
                ->get();

            $generatedInvoices = collect();

            foreach ($enrollments as $enrollment) {
                foreach ($fees as $fee) {
                    $invoice = StudentFee::firstOrCreate(
                        [
                            'student_enrollment_id' => $enrollment->id,
                            'fee_category_id' => $fee->id,
                            'academic_session_id' => $sessionId,
                            'term_id' => $termId,
                        ],
                        [
                            'amount' => $fee->amount,
                            'discount' => 0.00,
                            'amount_due' => $fee->amount,
                            'due_date' => $dueDate ?? now()->addDays(30)->toDateString(),
                            'status' => 'unpaid',
                        ]
                    );

                    $generatedInvoices->push($invoice);
                }
            }

            return $generatedInvoices;
        });
    }

    /**
     * Apply discount/scholarship to a student's fee invoice and recalculate due balance.
     */
    public function applyDiscount(
        StudentFee $studentFee,
        float $discountAmount,
        ?string $remarks = null
    ): StudentFee {
        $amountDue = max(0, $studentFee->amount - $discountAmount);

        $studentFee->update([
            'discount' => $discountAmount,
            'amount_due' => $amountDue,
            'remarks' => $remarks ?? $studentFee->remarks,
        ]);

        $this->recalculateStatus($studentFee);

        return $studentFee->fresh();
    }

    /**
     * Recalculate payment status based on total payments recorded.
     */
    public function recalculateStatus(StudentFee $studentFee): string
    {
        $totalPaid = DB::table('fee_payments')
            ->where('student_fee_id', $studentFee->id)
            ->sum('amount_paid');

        $amountDue = $studentFee->amount_due;

        if ($totalPaid <= 0) {
            $status = 'unpaid';
        } elseif ($totalPaid >= $amountDue) {
            $status = 'paid';
        } else {
            $status = 'partially_paid';
        }

        $studentFee->update(['status' => $status]);

        return $status;
    }
}
