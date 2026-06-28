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
        return [

            'student_enrollment_id' => 'sometimes|required|exists:student_enrollments,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'term_id' => 'sometimes|required|exists:terms,id',

            'attendance_date' => 'sometimes|required|date',

            'status' => 'sometimes|required|in:Present,Absent,Late,Excused',

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
