<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeeRequest extends FormRequest
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

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'term_id' => 'required|exists:terms,id',

            'division_id' => 'required|exists:divisions,id',

            'class_id' => 'required|exists:classes,id',

            'name' => 'required|string|max:100',

            'amount' => 'required|numeric|min:0',

            'category' => 'required|string|max:100',

            'description' => 'nullable|string',

            'is_active' => 'required|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',

            'academic_session_id.required' => 'Academic session is required.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',

            'term_id.required' => 'Term is required.',
            'term_id.exists' => 'Selected term does not exist.',

            'division_id.required' => 'Division is required.',
            'division_id.exists' => 'Selected division does not exist.',

            'class_id.required' => 'Class is required.',
            'class_id.exists' => 'Selected class does not exist.',

            'amount.required' => 'Fee amount is required.',
            'amount.numeric' => 'Fee amount must be numeric.',
        ];
    }
}
