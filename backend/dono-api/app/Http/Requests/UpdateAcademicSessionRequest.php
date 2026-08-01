<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicSessionRequest extends FormRequest
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
        $academicSession = $this->route('academic_session');

        return [

            'school_id' => 'sometimes|required|exists:schools,id',

            'name' =>
                'sometimes|required|string|max:100|unique:academic_sessions,name,' .
                $academicSession->id .
                ',id,school_id,' .
                ($this->school_id ?? $academicSession->school_id),

            'start_date' => 'sometimes|required|date',

            'end_date' => 'sometimes|required|date|after:start_date',

            'is_current' => 'sometimes|required|boolean',

            'status' => 'sometimes|required|in:active,closed',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'school_id.exists' =>
                'Selected school does not exist.',

            'name.required' =>
                'Academic Session name is required.',

            'name.unique' =>
                'This academic session already exists for the selected school.',

            'start_date.required' =>
                'Start date is required.',

            'end_date.required' =>
                'End date is required.',

            'end_date.after' =>
                'End date must be after the start date.',

            'is_current.required' =>
                'Please specify whether this is the current academic session.',

            'status.in' =>
                'Status must be either active or closed.',
        ];
    }
}
