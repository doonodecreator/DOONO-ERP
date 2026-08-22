<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => ['sometimes', 'nullable', 'integer', 'exists:schools,id'],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'maximum_marks' => ['sometimes', 'required', 'numeric', 'min:1', 'max:1000'],
            'percentage' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'display_order' => ['sometimes', 'required', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ];
    }
}
