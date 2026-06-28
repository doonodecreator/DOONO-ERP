<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'class_id' => ['required', 'exists:classes,id'],
            'stream_id' => ['nullable', 'exists:streams,id'],
            'admission_number' => ['required', 'string', 'max:100'],
            'roll_number' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:Active,Graduated,Transferred,Withdrawn'],
        ];
    }
}
