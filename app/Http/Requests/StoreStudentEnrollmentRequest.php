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
        $rules = [

            'student_id' => 'required|exists:students,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'division_id' => 'required|exists:divisions,id',

            'class_id' => 'required|exists:classes,id',

            'stream_id' => 'nullable|exists:streams,id',

            'enrollment_date' => 'required|date',

            'status' => 'required|in:Active,Promoted,Repeated,Graduated,Transferred,Withdrawn',
        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'required|exists:schools,id';
        }

        return $rules;
    }
}
