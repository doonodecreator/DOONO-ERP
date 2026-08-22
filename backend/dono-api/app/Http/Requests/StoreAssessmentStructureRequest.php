<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssessmentStructureRequest extends FormRequest
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

            'school_id' => 'nullable|integer|exists:schools,id',

            'name' => 'required|string|max:100',

            'maximum_marks' => 'required|numeric|min:1|max:1000',

            'percentage' => 'required|numeric|min:0|max:100',

            'display_order' => 'required|integer|min:1',

            'is_active' => 'required|boolean',

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

            'maximum_marks.min' =>
                'Maximum marks must be greater than zero.',

            'percentage.max' =>
                'Percentage cannot exceed 100%.',

        ];
    }
}
