<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeePaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $studentFee = $this->studentFee;
        $student = $studentFee?->studentEnrollment?->student;

        return [
            'id' => $this->id,
            'student_fee_id' => $this->student_fee_id,
            'invoice_number' => $studentFee?->invoice_number,
            'student' => $student ? [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'admission_number' => $student->admission_number,
            ] : null,
            'staff_id' => $this->staff_id,
            'receipt_number' => $this->receipt_number,
            'amount_paid' => $this->amount_paid,
            'payment_date' => $this->payment_date,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'bank_name' => $this->bank_name,
            'remarks' => $this->remarks,
            'reversed_at' => $this->reversed_at,
            'reversed_by' => $this->reversed_by,
            'reversal_reason' => $this->reversal_reason,
            'is_reversed' => (bool) $this->reversed_at,
            'invoice_amount_due' => $studentFee?->amount_due,
            'invoice_balance' => $studentFee ? $studentFee->balance : null,
            'receipt' => $this->whenLoaded('receipt', fn () => $this->receipt ? [
                'id' => $this->receipt->id,
                'receipt_number' => $this->receipt->receipt_number,
                'issued_at' => $this->receipt->issued_at,
                'cancelled' => (bool) $this->receipt->cancelled,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
