<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $term = $this->route('term');

        return [
            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'name' => 'sometimes|required|in:First Term,Second Term,Third Term|unique:terms,name,' .
                $term->id . ',id,academic_session_id,' .
                ($this->academic_session_id ?? $term->academic_session_id),

            'start_date' => 'sometimes|required|date',

            'end_date' => 'sometimes|required|date|after:start_date',

            'is_current' => 'sometimes|required|boolean',

            'status' => 'sometimes|required|in:active,closed',
        ];
    }

    public function messages(): array
    {
        return [
            'academic_session_id.exists' => 'Selected academic session does not exist.',
            'name.unique' => 'This term already exists for the selected academic session.',
            'name.in' => 'Term must be First Term, Second Term or Third Term.',
            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
