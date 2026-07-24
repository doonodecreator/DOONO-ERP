<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDivisionRequest extends FormRequest
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
        $division = $this->route('division');

        return [
            'school_id' => 'sometimes|required|exists:schools,id',

            'name' => 'sometimes|required|string|max:100|unique:divisions,name,' .
                $division->id . ',id,school_id,' .
                ($this->school_id ?? $division->school_id),

            'code' => 'nullable|string|max:20',

            'display_order' => 'nullable|integer|min:1',

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
            'name.unique' => 'This division already exists for the selected school.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
