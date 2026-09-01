<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamScoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'student_enrollment_id' => 'required|exists:student_enrollments,id',

            'class_subject_id' => 'required|exists:class_subject,id',

            'examination_id' => 'required|exists:examinations,id',

            'ca_score' => 'required|numeric|min:0|max:100',

            'exam_score' => 'required|numeric|min:0|max:100',

            'total_score' => 'required|numeric|min:0|max:100',

            'grade' => 'nullable|string|max:5',

            'remark' => 'nullable|string|max:255',

            'position' => 'nullable|integer|min:1',

            'staff_id' => 'nullable|exists:staff,id',
        ];
    }

    public function messages(): array
    {
        return [
            'student_enrollment_id.exists' => 'Selected student enrollment does not exist.',
            'class_subject_id.exists' => 'Selected class subject does not exist.',
            'examination_id.exists' => 'Selected examination does not exist.',
            'staff_id.exists' => 'Selected staff member does not exist.',
        ];
    }
}
