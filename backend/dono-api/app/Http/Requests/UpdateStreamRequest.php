<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStreamRequest extends FormRequest
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
        $stream = $this->route('stream');

        return [
            'class_id' => 'sometimes|required|exists:classes,id',

            'name' => 'sometimes|required|string|max:100|unique:streams,name,' .
                $stream->id . ',id,class_id,' .
                ($this->class_id ?? $stream->class_id),

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
            'class_id.exists' => 'Selected class does not exist.',
            'name.unique' => 'This stream already exists for the selected class.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
