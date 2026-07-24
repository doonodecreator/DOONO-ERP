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
            'name' => 'required|string|max:100',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after:start_date',

            'is_active' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Academic Session name is required.',

            'start_date.required' => 'Start date is required.',

            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
