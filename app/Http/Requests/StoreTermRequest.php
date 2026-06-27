<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'name' => 'required|in:First Term,Second Term,Third Term',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'required|boolean',
            'status' => 'required|in:active,closed',
        ];
    }

    public function messages(): array
    {
        return [
            'academic_session_id.required' => 'Academic session is required.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'name.required' => 'Term name is required.',
            'name.in' => 'Term must be First Term, Second Term or Third Term.',
            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
