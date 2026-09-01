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
        return [
            'id' => $this->id,
            'student_fee_id' => $this->student_fee_id,
            'staff_id' => $this->staff_id,
            'receipt_number' => $this->receipt_number,
            'amount_paid' => $this->amount_paid,
            'payment_date' => $this->payment_date,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'bank_name' => $this->bank_name,
            'remarks' => $this->remarks,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
