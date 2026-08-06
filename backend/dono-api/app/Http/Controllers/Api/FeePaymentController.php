<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeePaymentRequest;
use App\Http\Requests\UpdateFeePaymentRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;
use App\Models\StudentFee;
use App\Services\Finance\PaymentService;

class FeePaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function index()
    {
        $schoolId = request()->attributes->get('current_school_id') ?? auth()->user()->school_id ?? null;

        return FeePaymentResource::collection(
            FeePayment::whereHas('studentFee', function ($query) use ($schoolId) {
                if ($schoolId) {
                    $query->where('school_id', $schoolId);
                }
            })
            ->with(['studentFee.studentEnrollment.student', 'staff', 'receipt'])
            ->latest()
            ->get()
        );
    }

    public function store(StoreFeePaymentRequest $request)
    {
        $data = $request->validated();
        $data['staff_id'] = auth()->id();

        $payment = $this->paymentService->recordPayment($data);

        return new FeePaymentResource(
            $payment->load(['studentFee.studentEnrollment.student', 'staff', 'receipt'])
        );
    }

    public function show(FeePayment $feePayment)
    {
        return new FeePaymentResource(
            $feePayment->load(['studentFee.studentEnrollment.student', 'staff', 'receipt'])
        );
    }

    public function destroy(FeePayment $feePayment)
    {
        $studentFee = $feePayment->studentFee;
        $feePayment->delete();

        // Recalculate invoice status using PaymentService dependency
        app(\App\Services\Finance\FeeService::class)->recalculateStatus($studentFee);

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }
}
