<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $school = $this->route('school');

        return [
            'organization_id' => 'sometimes|required|exists:organizations,id',
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'school_type' => 'sometimes|required|in:Primary,Secondary,Combined',
            'has_primary' => 'sometimes|required|boolean',
            'has_secondary' => 'sometimes|required|boolean',
            'school_code' => 'sometimes|required|string|max:50|unique:schools,school_code,' . $school->id,
            'email' => 'nullable|email|max:255|unique:schools,email,' . $school->id,
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'logo' => 'nullable|string|max:255',
            'status' => 'sometimes|required|in:active,inactive',
        ];
    }
}
