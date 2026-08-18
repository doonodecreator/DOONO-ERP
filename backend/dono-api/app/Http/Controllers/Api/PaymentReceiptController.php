<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentReceiptResource;
use App\Models\PaymentReceipt;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PaymentReceiptController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return PaymentReceiptResource::collection(
            PaymentReceipt::whereHas('feePayment.studentFee.studentEnrollment.student', function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
                ->with(['feePayment.studentFee.studentEnrollment.student', 'feePayment.staff'])
                ->latest()
                ->paginate(20)
        );
    }

    public function show(Request $request, PaymentReceipt $paymentReceipt)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        $paymentReceipt->load('feePayment.studentFee.studentEnrollment.student');

        if ((int) $paymentReceipt->feePayment?->studentFee?->studentEnrollment?->student?->school_id !== (int) $schoolId) {
            throw new NotFoundHttpException('Receipt not found in the current school.');
        }

        return new PaymentReceiptResource(
            $paymentReceipt->load(['feePayment.studentFee.studentEnrollment.student', 'feePayment.staff'])
        );
    }
}
