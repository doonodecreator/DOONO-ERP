<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeePaymentRequest;
use App\Http\Requests\UpdateFeePaymentRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;
use App\Models\StudentFee;
use App\Services\CurrentContextService;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;

class FeePaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return FeePaymentResource::collection(
            FeePayment::whereHas('studentFee.studentEnrollment.student', function ($query) use ($schoolId) {
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
        $data['staff_id'] = $request->user()->id;

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

        app(\App\Services\Finance\FeeService::class)->recalculateStatus($studentFee);

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }
}
