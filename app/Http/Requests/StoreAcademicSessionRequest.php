<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAcademicSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'required|boolean',
            'status' => 'required|in:active,closed',
        ];
    }

    public function messages(): array
    {
        return [
            'school_id.required' => 'School is required.',
            'school_id.exists' => 'Selected school does not exist.',
            'name.required' => 'Academic session name is required.',
            'start_date.required' => 'Start date is required.',
            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
