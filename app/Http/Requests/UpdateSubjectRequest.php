<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSubjectRequest extends FormRequest
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
        $subjectId = $this->route('subject')->id;

        return [

            'school_id' => 'sometimes|required|exists:schools,id',

            'division_id' => 'sometimes|required|exists:divisions,id',

            'name' => 'sometimes|required|string|max:100',

            'code' => 'sometimes|required|string|max:20|unique:subjects,code,' . $subjectId,

            'category' => 'sometimes|required|in:Core,Elective',

            'pass_mark' => 'sometimes|required|integer|min:0|max:100',

            'maximum_mark' => 'sometimes|required|integer|min:1|max:100',

            'is_active' => 'sometimes|required|boolean',

            'description' => 'nullable|string',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'division_id.exists' => 'Selected division does not exist.',
            'code.unique' => 'Subject code already exists.',
        ];
    }
}
