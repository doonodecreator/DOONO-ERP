<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentFeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'student_enrollment_id' => $this->student_enrollment_id,

            'fee_category_id' => $this->fee_category_id,

            'academic_session_id' => $this->academic_session_id,

            'term_id' => $this->term_id,

            'amount' => $this->amount,

            'discount' => $this->discount,

            'amount_due' => $this->amount_due,

            'due_date' => $this->due_date,

            'status' => $this->status,

            'remarks' => $this->remarks,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
