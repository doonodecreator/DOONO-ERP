<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentReceiptResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fee_payment_id' => $this->fee_payment_id,
            'receipt_number' => $this->receipt_number,
            'issued_by' => $this->issued_by,
            'issued_at' => $this->issued_at,
            'printed' => $this->printed,
            'printed_at' => $this->printed_at,
            'emailed' => $this->emailed,
            'emailed_at' => $this->emailed_at,
            'cancelled' => $this->cancelled,
            'cancellation_reason' => $this->cancellation_reason,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
