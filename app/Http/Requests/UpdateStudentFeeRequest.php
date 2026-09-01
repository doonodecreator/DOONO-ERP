<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'student_enrollment_id' => 'sometimes|required|exists:student_enrollments,id',

            'fee_category_id' => 'sometimes|required|exists:fee_categories,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'term_id' => 'sometimes|required|exists:terms,id',

            'amount' => 'sometimes|required|numeric|min:0',

            'discount' => 'nullable|numeric|min:0',

            'amount_due' => 'sometimes|required|numeric|min:0',

            'due_date' => 'nullable|date',

            'status' => 'sometimes|required|in:Pending,Partial,Paid,Waived',

            'remarks' => 'nullable|string',

        ];
    }

    public function messages(): array
    {
        return [
            'student_enrollment_id.exists' => 'Selected student enrollment does not exist.',
            'fee_category_id.exists' => 'Selected fee category does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'term_id.exists' => 'Selected term does not exist.',
        ];
    }
}
