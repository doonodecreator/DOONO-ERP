<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeePaymentRequest;
use App\Http\Requests\UpdateFeePaymentRequest;
use App\Http\Resources\FeePaymentResource;
use App\Models\FeePayment;

class FeePaymentController extends Controller
{
    public function index()
    {
        return FeePaymentResource::collection(
            FeePayment::latest()->paginate(20)
        );
    }

    public function store(StoreFeePaymentRequest $request)
    {
        $feePayment = FeePayment::create($request->validated());

        return new FeePaymentResource($feePayment);
    }

    public function show(FeePayment $feePayment)
    {
        return new FeePaymentResource($feePayment);
    }

    public function update(UpdateFeePaymentRequest $request, FeePayment $feePayment)
    {
        $feePayment->update($request->validated());

        return new FeePaymentResource($feePayment);
    }

    public function destroy(FeePayment $feePayment)
    {
        $feePayment->delete();

        return response()->json([
            'message' => 'Fee payment deleted successfully.'
        ]);
    }
}
