<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeePaymentRequest;
use App\Http\Requests\UpdateFeePaymentRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;
use App\Models\Staff;
use App\Models\StudentFee;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class FeePaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;

        return FeePaymentResource::collection(
            FeePayment::whereHas('studentFee.studentEnrollment.student', function ($query) use ($schoolId) {
                if ($schoolId) {
                    $query->where('school_id', $schoolId);
                }
            })
            ->with(['studentFee.studentEnrollment.student', 'studentFee.payments', 'staff', 'receipt'])
            ->latest()
            ->get()
        );
    }

    public function store(StoreFeePaymentRequest $request)
    {
        $data = $request->validated();
        $schoolId = $this->context->currentSchool($request->user())?->id;

        $studentFee = StudentFee::whereKey($data['student_fee_id'])
            ->whereHas('studentEnrollment.student', function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->first();

        if (! $studentFee) {
            throw new NotFoundHttpException('The selected student fee does not belong to the current school.');
        }

        $data['staff_id'] = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->value('id');

        $payment = $this->paymentService->recordPayment($data);
        ActivityLogService::log(
            module: 'fee_payments',
            action: 'recorded',
            description: 'A manual fee payment was recorded and an official receipt was generated.',
            subject: $payment,
            schoolId: (int) $schoolId,
            properties: ['student_fee_id' => $studentFee->id, 'amount_paid' => $payment->amount_paid, 'payment_method' => $payment->payment_method],
        );

        return new FeePaymentResource(
            $payment->load(['studentFee.studentEnrollment.student', 'studentFee.payments', 'staff', 'receipt'])
        );
    }

    public function show(Request $request, FeePayment $feePayment)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $feePayment->load('studentFee.studentEnrollment.student');

        if ((int) $feePayment->studentFee?->studentEnrollment?->student?->school_id !== (int) $schoolId) {
            throw new NotFoundHttpException('Payment not found in the current school.');
        }

        return new FeePaymentResource(
            $feePayment->load(['studentFee.studentEnrollment.student', 'studentFee.payments', 'staff', 'receipt'])
        );
    }

}
