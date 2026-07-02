<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [

            'student_enrollment_id' => 'sometimes|required|exists:student_enrollments,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'term_id' => 'sometimes|required|exists:terms,id',

            'attendance_date' => 'sometimes|required|date',

            'status' => 'sometimes|required|in:Present,Absent,Late,Excused',

            'remarks' => 'nullable|string',

            'staff_id' => 'nullable|exists:staff,id',

        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'sometimes|required|exists:schools,id';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
        ];
    }
}
