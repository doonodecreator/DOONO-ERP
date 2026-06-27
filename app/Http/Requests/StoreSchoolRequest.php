<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_id' => 'required|exists:organizations,id',
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'school_type' => 'required|in:Primary,Secondary,Combined',
            'has_primary' => 'required|boolean',
            'has_secondary' => 'required|boolean',
            'school_code' => 'required|string|max:50|unique:schools,school_code',
            'email' => 'nullable|email|max:255|unique:schools,email',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'logo' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ];
    }

    public function messages(): array
    {
        return [
            'organization_id.required' => 'Organization is required.',
            'organization_id.exists' => 'Selected organization does not exist.',
            'name.required' => 'School name is required.',
            'school_type.required' => 'School type is required.',
            'school_code.required' => 'School code is required.',
        ];
    }
}
