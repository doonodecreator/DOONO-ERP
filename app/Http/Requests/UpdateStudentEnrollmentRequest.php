<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'exists:students,id'],
            'academic_session_id' => ['sometimes', 'exists:academic_sessions,id'],
            'class_id' => ['sometimes', 'exists:classes,id'],
            'stream_id' => ['nullable', 'exists:streams,id'],
            'admission_number' => ['sometimes', 'string', 'max:100'],
            'roll_number' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:Active,Graduated,Transferred,Withdrawn'],
        ];
    }
}
