<?php

namespace App\Services\Finance;

use App\Models\Fee;
use App\Models\FeeCategory;
use App\Models\StudentEnrollment;
use App\Models\StudentFee;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FeeService
{
    /**
     * Generate invoices for one configured fee across active students in a class.
     * Existing matching invoices are reused instead of duplicated.
     */
    public function generateClassInvoices(
        int $schoolId,
        int $feeId,
        int $classId,
        int $sessionId,
        int $termId,
        ?string $dueDate = null
    ): Collection {
        return DB::transaction(function () use ($schoolId, $feeId, $classId, $sessionId, $termId, $dueDate) {
            $fee = Fee::query()
                ->whereKey($feeId)
                ->where('school_id', $schoolId)
                ->where('academic_session_id', $sessionId)
                ->where('term_id', $termId)
                ->where('class_id', $classId)
                ->where('is_active', true)
                ->first();

            if (! $fee) {
                return collect();
            }

            $category = $this->syncConfiguredCategory($fee, $schoolId);
            $enrollments = StudentEnrollment::query()
                ->where('school_id', $schoolId)
                ->where('class_id', $classId)
                ->where('academic_session_id', $sessionId)
                ->where('status', 'Active')
                ->get();

            $generatedInvoices = collect();
            foreach ($enrollments as $enrollment) {
                $generatedInvoices->push(StudentFee::firstOrCreate(
                    [
                        'student_enrollment_id' => $enrollment->id,
                        'fee_category_id' => $category->id,
                        'academic_session_id' => $sessionId,
                        'term_id' => $termId,
                    ],
                    [
                        'amount' => $fee->amount,
                        'discount' => 0.00,
                        'amount_due' => $fee->amount,
                        'due_date' => $dueDate ?? now()->addDays(30)->toDateString(),
                        'status' => 'unpaid',
                    ],
                ));
            }

            return $generatedInvoices;
        });
    }

    /**
     * Keep the legacy student invoice foreign key connected to the configured fee.
     */
    private function syncConfiguredCategory(Fee $fee, int $schoolId): FeeCategory
    {
        $category = FeeCategory::firstOrNew(['code' => 'CONFIGURED-FEE-'.$fee->id]);
        if ($category->exists && (int) $category->school_id !== $schoolId) {
            throw new \RuntimeException('A configured fee category belongs to another school.');
        }

        $category->fill([
            'school_id' => $schoolId,
            'name' => $fee->name,
            'description' => $fee->description,
            'default_amount' => $fee->amount,
            'frequency' => 'Termly',
            'is_mandatory' => true,
            'is_active' => (bool) $fee->is_active,
        ]);
        $category->save();

        return $category;
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
        $paymentsQuery = DB::table('fee_payments')->where('student_fee_id', $studentFee->id);
        if (Schema::hasColumn('fee_payments', 'reversed_at')) {
            $paymentsQuery->whereNull('reversed_at');
        }
        $totalPaid = $paymentsQuery->sum('amount_paid');
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
