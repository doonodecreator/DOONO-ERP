<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'student_enrollment_id' => 'required|exists:student_enrollments,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'attendance_date' => 'required|date',

            'status' => 'required|in:Present,Absent,Late,Excused',

            'remarks' => 'nullable|string',

            'staff_id' => 'nullable|exists:staff,id',

        ];
    }

    public function messages(): array
    {
        return [
            'student_enrollment_id.exists' => 'Selected student enrollment does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'term_id.exists' => 'Selected term does not exist.',
            'staff_id.exists' => 'Selected staff member does not exist.',
        ];
    }
}
