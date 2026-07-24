<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentReceiptRequest;
use App\Http\Requests\UpdatePaymentReceiptRequest;
use App\Http\Resources\PaymentReceiptResource;
use App\Models\PaymentReceipt;

class PaymentReceiptController extends Controller
{
    public function index()
    {
        return PaymentReceiptResource::collection(
            PaymentReceipt::latest()->paginate(20)
        );
    }

    public function store(StorePaymentReceiptRequest $request)
    {
        $paymentReceipt = PaymentReceipt::create(
            $request->validated()
        );

        return new PaymentReceiptResource($paymentReceipt);
    }

    public function show(PaymentReceipt $paymentReceipt)
    {
        return new PaymentReceiptResource($paymentReceipt);
    }

    public function update(UpdatePaymentReceiptRequest $request, PaymentReceipt $paymentReceipt)
    {
        $paymentReceipt->update(
            $request->validated()
        );

        return new PaymentReceiptResource($paymentReceipt);
    }

    public function destroy(PaymentReceipt $paymentReceipt)
    {
        $paymentReceipt->delete();

        return response()->json([
            'message' => 'Payment receipt deleted successfully.'
        ]);
    }
}
