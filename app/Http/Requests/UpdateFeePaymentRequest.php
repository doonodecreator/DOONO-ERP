<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFeePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $feePaymentId = $this->route('fee_payment')->id;

        return [
            'student_fee_id' => ['required', 'exists:student_fees,id'],
            'staff_id' => ['nullable', 'exists:staff,id'],
            'receipt_number' => ['required', 'string', 'max:255', 'unique:fee_payments,receipt_number,' . $feePaymentId],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'in:Cash,Bank Transfer,POS,Cheque,Online'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
