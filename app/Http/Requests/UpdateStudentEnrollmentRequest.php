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
        $rules = [

            'student_id' => 'sometimes|exists:students,id',

            'academic_session_id' => 'sometimes|exists:academic_sessions,id',

            'term_id' => 'sometimes|exists:terms,id',

            'division_id' => 'sometimes|exists:divisions,id',

            'class_id' => 'sometimes|exists:classes,id',

            'stream_id' => 'nullable|exists:streams,id',

            'enrollment_date' => 'sometimes|date',

            'status' => 'sometimes|in:Active,Promoted,Repeated,Graduated,Transferred,Withdrawn',
        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'sometimes|required|exists:schools,id';
        }

        return $rules;
    }
}
