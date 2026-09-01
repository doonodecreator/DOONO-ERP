<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTimetableRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'school_id' => 'sometimes|required|exists:schools,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'term_id' => 'sometimes|required|exists:terms,id',

            'division_id' => 'sometimes|required|exists:divisions,id',

            'class_id' => 'sometimes|required|exists:classes,id',

            'stream_id' => 'nullable|exists:streams,id',

            'subject_id' => 'sometimes|required|exists:subjects,id',

            'staff_id' => 'nullable|exists:staff,id',

            'day_of_week' => 'sometimes|required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',

            'start_time' => 'sometimes|required|date_format:H:i',

            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',

            'room' => 'nullable|string|max:100',

            'is_active' => 'sometimes|required|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'term_id.exists' => 'Selected term does not exist.',
            'division_id.exists' => 'Selected division does not exist.',
            'class_id.exists' => 'Selected class does not exist.',
            'stream_id.exists' => 'Selected stream does not exist.',
            'subject_id.exists' => 'Selected subject does not exist.',
            'staff_id.exists' => 'Selected staff member does not exist.',
            'end_time.after' => 'End time must be after start time.',
        ];
    }
}
