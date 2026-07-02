<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportCardRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'school_id' => 'required|exists:schools,id',

            'student_enrollment_id' => 'required|exists:student_enrollments,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'total_score' => 'required|numeric|min:0|max:1000',

            'average_score' => 'required|numeric|min:0|max:100',

            'position' => 'nullable|integer|min:1',

            'overall_grade' => 'nullable|string|max:5',

            'overall_remark' => 'nullable|string|max:255',

            'teacher_comment' => 'nullable|string',

            'principal_comment' => 'nullable|string',

            'is_published' => 'nullable|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'student_enrollment_id.exists' => 'Selected student enrollment does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'term_id.exists' => 'Selected term does not exist.',
        ];
    }
}
