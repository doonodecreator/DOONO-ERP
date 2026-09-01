<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $paymentReceiptId = $this->route('payment_receipt')->id;

        return [
            'fee_payment_id' => 'required|exists:fee_payments,id',
            'receipt_number' => 'required|string|max:255|unique:payment_receipts,receipt_number,' . $paymentReceiptId,
            'issued_by' => 'nullable|string|max:255',
            'issued_at' => 'required|date',
            'printed' => 'boolean',
            'printed_at' => 'nullable|date',
            'emailed' => 'boolean',
            'emailed_at' => 'nullable|date',
            'cancelled' => 'boolean',
            'cancellation_reason' => 'nullable|string',
        ];
    }
}
