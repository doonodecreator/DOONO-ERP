<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'nullable|exists:schools,id',

            'division_id' => 'nullable|exists:divisions,id',

            'name' => 'required|string|max:100',

            'code' => 'required|string|max:20|unique:subjects,code',

            'category' => 'nullable|string|max:50',

            'pass_mark' => 'required|integer|min:0|max:100',

            'maximum_mark' => 'required|integer|min:1|max:100',

            'is_active' => 'required|boolean',

            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' =>
                'Subject code already exists.',
        ];
    }
}
