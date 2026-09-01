<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFeeRequest extends FormRequest
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

            'name' => 'sometimes|required|string|max:100',

            'amount' => 'sometimes|required|numeric|min:0',

            'category' => 'sometimes|required|string|max:100',

            'description' => 'nullable|string',

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
            'amount.numeric' => 'Fee amount must be numeric.',
        ];
    }
}
