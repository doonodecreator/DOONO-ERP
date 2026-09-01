<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',

            'student_enrollment_id' => 'required|exists:student_enrollments,id',

            'subject_id' => 'required|exists:subjects,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'ca_score' => 'required|numeric|min:0|max:40',

            'exam_score' => 'required|numeric|min:0|max:60',

            'total_score' => 'nullable|numeric|min:0|max:100',

            'grade' => 'nullable|string|max:5',

            'remark' => 'nullable|string|max:255',

            'position' => 'nullable|integer|min:1',

            'is_published' => 'nullable|boolean',
        ];
    }
}
