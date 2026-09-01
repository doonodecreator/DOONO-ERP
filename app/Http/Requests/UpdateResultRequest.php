<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'school_id' => 'sometimes|required|exists:schools,id',

            'student_enrollment_id' => 'sometimes|required|exists:student_enrollments,id',

            'subject_id' => 'sometimes|required|exists:subjects,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'term_id' => 'sometimes|required|exists:terms,id',

            'ca_score' => 'sometimes|required|numeric|min:0|max:40',

            'exam_score' => 'sometimes|required|numeric|min:0|max:60',

            'total_score' => 'nullable|numeric|min:0|max:100',

            'grade' => 'nullable|string|max:5',

            'remark' => 'nullable|string|max:255',

            'position' => 'nullable|integer|min:1',

            'is_published' => 'nullable|boolean',
        ];
    }
}
