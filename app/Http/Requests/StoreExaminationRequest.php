<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExaminationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'school_id' => 'required|exists:schools,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'name' => 'required|string|max:255',

            'exam_type' => 'required|in:CA1,CA2,Mid-Term,Examination,Mock,Promotion,Other',

            'total_marks' => 'required|integer|min:1|max:1000',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after_or_equal:start_date',

            'status' => 'required|in:Draft,Scheduled,Ongoing,Completed',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'term_id.exists' => 'Selected term does not exist.',
            'end_date.after_or_equal' => 'End date must be the same as or after the start date.',
        ];
    }
}
