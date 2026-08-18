<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDivisionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules.
     */
    public function rules(): array
    {
        return [
            'school_id' => 'sometimes|exists:schools,id',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer|min:1',
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
            'name.required' => 'Division name is required.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
