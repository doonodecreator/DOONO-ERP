<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassRequest extends FormRequest
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
            'division_id' => 'required|exists:divisions,id',
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
            'division_id.required' => 'Division is required.',
            'division_id.exists' => 'Selected division does not exist.',
            'name.required' => 'Class name is required.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
