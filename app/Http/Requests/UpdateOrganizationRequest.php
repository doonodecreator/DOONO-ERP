<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
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
        $organization = $this->route('organization');

        return [
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:100',
            'registration_number' => 'nullable|string|max:100|unique:organizations,registration_number,' . $organization->id,
            'email' => 'nullable|email|max:255|unique:organizations,email,' . $organization->id,
            'phone' => 'nullable|string|max:20',
            'alternative_phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string|max:255',
            'country' => 'sometimes|required|string|max:100',
            'state' => 'sometimes|required|string|max:100',
            'lga' => 'sometimes|required|string|max:100',
            'address' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive,suspended',
        ];
    }
}
