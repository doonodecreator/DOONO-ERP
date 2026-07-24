<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateParentStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => 'sometimes|exists:parents,id',
            'student_id' => 'sometimes|exists:students,id',
            'is_primary_contact' => 'nullable|boolean',
        ];
    }
}
