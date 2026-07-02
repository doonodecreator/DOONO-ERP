<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [

            'father_name' => 'nullable|string|max:100',
            'father_phone' => 'nullable|string|max:20',
            'father_email' => 'nullable|email|max:255',
            'father_occupation' => 'nullable|string|max:100',

            'mother_name' => 'nullable|string|max:100',
            'mother_phone' => 'nullable|string|max:20',
            'mother_email' => 'nullable|email|max:255',
            'mother_occupation' => 'nullable|string|max:100',

            'guardian_name' => 'nullable|string|max:100',
            'guardian_phone' => 'nullable|string|max:20',
            'guardian_email' => 'nullable|email|max:255',
            'guardian_occupation' => 'nullable|string|max:100',
            'guardian_relationship' => 'nullable|string|max:100',

            'address' => 'nullable|string',
        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'sometimes|required|exists:schools,id';
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
        ];
    }
}
