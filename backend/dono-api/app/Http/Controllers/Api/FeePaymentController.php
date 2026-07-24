<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeePaymentRequest;
use App\Http\Requests\UpdateFeePaymentRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;
use App\Models\StudentFee;
use App\Models\PaymentReceipt;

class FeePaymentController extends Controller
{
    public function index()
    {
        return FeePaymentResource::collection(
            FeePayment::with(['studentFee', 'staff', 'receipt'])->latest()->get()
        );
    }

    public function store(StoreFeePaymentRequest $request)
    {
        $payment = FeePayment::create($request->validated());

        $studentFee = StudentFee::findOrFail($payment->student_fee_id);

        $totalPaid = $studentFee->payments()->sum('amount_paid');

        if ($totalPaid <= 0) {
            $studentFee->status = 'Pending';
        } elseif ($totalPaid < $studentFee->amount_due) {
            $studentFee->status = 'Partial';
        } else {
            $studentFee->status = 'Paid';
        }

        $studentFee->save();

        PaymentReceipt::create([
            'fee_payment_id' => $payment->id,
            'receipt_number' => $payment->receipt_number,
            'issued_by' => auth()->check() ? auth()->user()->name : 'System',
            'issued_at' => now(),
            'printed' => false,
            'printed_at' => null,
            'emailed' => false,
            'emailed_at' => null,
            'cancelled' => false,
            'cancellation_reason' => null,
        ]);

        return new FeePaymentResource(
            $payment->load(['studentFee', 'staff', 'receipt'])
        );
    }

    public function show(FeePayment $feePayment)
    {
        return new FeePaymentResource(
            $feePayment->load(['studentFee', 'staff', 'receipt'])
        );
    }

    public function update(UpdateFeePaymentRequest $request, FeePayment $feePayment)
    {
        $feePayment->update($request->validated());

        $studentFee = StudentFee::findOrFail($feePayment->student_fee_id);

        $totalPaid = $studentFee->payments()->sum('amount_paid');

        if ($totalPaid <= 0) {
            $studentFee->status = 'Pending';
        } elseif ($totalPaid < $studentFee->amount_due) {
            $studentFee->status = 'Partial';
        } else {
            $studentFee->status = 'Paid';
        }

        $studentFee->save();

        return new FeePaymentResource(
            $feePayment->load(['studentFee', 'staff', 'receipt'])
        );
    }

    public function destroy(FeePayment $feePayment)
    {
        $studentFee = $feePayment->studentFee;

        $feePayment->delete();

        $totalPaid = $studentFee->payments()->sum('amount_paid');

        if ($totalPaid <= 0) {
            $studentFee->status = 'Pending';
        } elseif ($totalPaid < $studentFee->amount_due) {
            $studentFee->status = 'Partial';
        } else {
            $studentFee->status = 'Paid';
        }

        $studentFee->save();

        return response()->json([
            'message' => 'Payment deleted successfully.'
        ]);
    }
}
