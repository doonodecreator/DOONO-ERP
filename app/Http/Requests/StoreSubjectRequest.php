<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
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

            'school_id' => 'required|exists:schools,id',

            'division_id' => 'required|exists:divisions,id',

            'name' => 'required|string|max:100',

            'code' => 'required|string|max:20|unique:subjects,code',

            'category' => 'required|in:Core,Elective',

            'pass_mark' => 'required|integer|min:0|max:100',

            'maximum_mark' => 'required|integer|min:1|max:100',

            'is_active' => 'required|boolean',

            'description' => 'nullable|string',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.required' => 'School is required.',
            'school_id.exists' => 'Selected school does not exist.',

            'division_id.required' => 'Division is required.',
            'division_id.exists' => 'Selected division does not exist.',

            'code.unique' => 'Subject code already exists.',
        ];
    }
}
