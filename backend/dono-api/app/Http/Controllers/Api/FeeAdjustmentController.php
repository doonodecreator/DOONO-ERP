<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeePayment;
use App\Models\StudentFee;
use App\Services\ActivityLogService;
use App\Services\Finance\FeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeAdjustmentController extends Controller
{
    public function discounts(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => StudentFee::query()
            ->whereHas('studentEnrollment', fn ($query) => $query->where('school_id', $schoolId))
            ->with(['studentEnrollment.student', 'feeCategory', 'payments'])
            ->where('discount', '>', 0)
            ->latest()
            ->paginate(20)]);
    }

    public function applyDiscount(Request $request, StudentFee $studentFee)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($studentFee->studentEnrollment?->school_id === $schoolId || $studentFee->load('studentEnrollment')->studentEnrollment?->school_id === $schoolId, 404, 'Student fee not found in the current school.');
        $data = $request->validate([
            'discount' => ['required', 'numeric', 'min:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);
        abort_unless((float) $data['discount'] <= (float) $studentFee->amount, 422, 'Discount cannot exceed the original fee amount.');

        $before = $studentFee->toArray();
        $studentFee->update([
            'discount' => $data['discount'],
            'amount_due' => max(0, (float) $studentFee->amount - (float) $data['discount']),
            'remarks' => $data['remarks'] ?? $studentFee->remarks,
        ]);
        app(FeeService::class)->recalculateStatus($studentFee->fresh());
        ActivityLogService::log('Fees', 'DISCOUNT', 'Applied fee discount or scholarship.', $studentFee, ['before' => $before, 'after' => $studentFee->fresh()->toArray()], $schoolId);

        return response()->json(['message' => 'Discount or scholarship applied successfully.', 'data' => $studentFee->fresh()->load(['studentEnrollment.student', 'feeCategory'])]);
    }

    public function reversePayment(Request $request, FeePayment $feePayment)
    {
        $schoolId = $this->requireSchool($request);
        $feePayment->load(['studentFee.studentEnrollment.student', 'receipt']);
        abort_unless((int) $feePayment->studentFee?->studentEnrollment?->school_id === $schoolId, 404, 'Payment not found in the current school.');
        abort_if($feePayment->reversed_at, 422, 'This payment has already been reversed.');
        $data = $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        DB::transaction(function () use ($feePayment, $data, $schoolId) {
            $feePayment->update([
                'reversed_at' => now(),
                'reversed_by' => request()->user()->id,
                'reversal_reason' => $data['reason'],
            ]);
            if ($feePayment->receipt) {
                $feePayment->receipt->update(['cancelled' => true]);
            }
            app(FeeService::class)->recalculateStatus($feePayment->studentFee->fresh());
            ActivityLogService::log('Fees', 'REVERSE_PAYMENT', 'Reversed a fee payment and cancelled its receipt.', $feePayment, ['reason' => $data['reason'], 'amount' => $feePayment->amount_paid], $schoolId);
        });

        return response()->json(['message' => 'Payment reversed and receipt cancelled successfully.', 'data' => $feePayment->fresh()->load(['studentFee.studentEnrollment.student', 'receipt', 'reversedBy'])]);
    }
}
