<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'registration_number' => 'nullable|string|max:100|unique:organizations,registration_number',
            'email' => 'nullable|email|max:255|unique:organizations,email',
            'phone' => 'nullable|string|max:20',
            'alternative_phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string|max:255',
            'country' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'lga' => 'required|string|max:100',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive,suspended',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Organization name is required.',
            'country.required' => 'Country is required.',
            'state.required' => 'State is required.',
            'lga.required' => 'Local Government Area is required.',
            'status.in' => 'Status must be active, inactive, or suspended.',
        ];
    }
}
