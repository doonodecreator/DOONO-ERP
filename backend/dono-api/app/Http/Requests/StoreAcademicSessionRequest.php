<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademicSessionRequest extends FormRequest
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

            'school_id' => 'sometimes|exists:schools,id',

            'name' => 'required|string|max:100',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after:start_date',

            'is_current' => 'required|boolean',
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

            'start_date.required' =>
                'Start date is required.',

            'end_date.required' =>
                'End date is required.',

            'end_date.after' =>
                'End date must be after the start date.',

            'is_current.required' =>
                'Please specify whether this is the current academic session.',
        ];
    }
}
