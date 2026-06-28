<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreParentStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => ['required', 'exists:parents,id'],
            'student_id' => ['required', 'exists:students,id'],
            'relationship' => ['required', 'string', 'max:100'],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }
}
