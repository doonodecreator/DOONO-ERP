<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentFeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $student = $this->studentEnrollment?->student;
        $payments = $this->whenLoaded('payments');

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
            'student' => $student ? [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'admission_number' => $student->admission_number,
                'school_id' => $student->school_id,
            ] : null,
            'student_name' => $student?->full_name,
            'fee_category' => $this->whenLoaded('feeCategory', fn () => [
                'id' => $this->feeCategory?->id,
                'name' => $this->feeCategory?->name,
            ]),
            'academic_session' => $this->whenLoaded('academicSession', fn () => [
                'id' => $this->academicSession?->id,
                'name' => $this->academicSession?->name,
            ]),
            'term' => $this->whenLoaded('term', fn () => [
                'id' => $this->term?->id,
                'name' => $this->term?->name,
            ]),
            'payments' => $payments,
            'paid_amount' => $this->whenLoaded('payments', fn () => $this->payments->sum('amount_paid')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
