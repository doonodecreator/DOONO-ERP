<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClassRequest extends FormRequest
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
        $class = $this->route('class');

        return [
            'division_id' => 'sometimes|required|exists:divisions,id',

            'name' => 'sometimes|required|string|max:100|unique:classes,name,' .
                $class->id . ',id,division_id,' .
                ($this->division_id ?? $class->division_id),

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
            'division_id.exists' => 'Selected division does not exist.',
            'name.unique' => 'This class already exists for the selected division.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
