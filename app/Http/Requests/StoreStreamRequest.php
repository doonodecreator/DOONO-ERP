<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStreamRequest extends FormRequest
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
            'class_id' => 'required|exists:classes,id',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'display_order' => 'nullable|integer|min:1',
            'is_active' => 'required|boolean',
        ];
    }

    /**
     * Custom messages.
     */
    public function messages(): array
    {
        return [
            'class_id.required' => 'Class is required.',
            'class_id.exists' => 'Selected class does not exist.',
            'name.required' => 'Stream name is required.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
