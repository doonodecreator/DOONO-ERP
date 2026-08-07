<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->filled('name') ? trim((string) $this->name) : null,
            'short_name' => $this->filled('short_name') ? trim((string) $this->short_name) : null,
            'registration_number' => $this->filled('registration_number') ? trim((string) $this->registration_number) : null,
            'email' => $this->filled('email') ? strtolower(trim((string) $this->email)) : null,
            'website' => $this->filled('website') ? trim((string) $this->website) : null,
            'country' => $this->filled('country') ? trim((string) $this->country) : null,
            'state' => $this->filled('state') ? trim((string) $this->state) : null,
            'lga' => $this->filled('lga') ? trim((string) $this->lga) : null,
        ]);
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        $organization = $this->route('organization');

        return [

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('organizations', 'name')->ignore($organization),
            ],

            'short_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'registration_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('organizations', 'registration_number')->ignore($organization),
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('organizations', 'email')->ignore($organization),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'alternative_phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'website' => [
                'nullable',
                'url',
                'max:255',
            ],

            'logo' => [
                'nullable',
                'string',
                'max:255',
            ],

            'country' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'state' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'lga' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'address' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'status' => [
                'sometimes',
                'required',
                'in:active,inactive,suspended',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Organization name is required.',
            'name.unique' => 'An organization with this name already exists.',

            'registration_number.unique' =>
                'This registration number is already in use.',

            'email.email' =>
                'Please enter a valid email address.',

            'email.unique' =>
                'This email address is already in use.',

            'website.url' =>
                'Please enter a valid website URL.',

            'country.required' =>
                'Country is required.',

            'state.required' =>
                'State is required.',

            'lga.required' =>
                'Local Government Area is required.',

            'status.in' =>
                'Status must be active, inactive or suspended.',
        ];
    }
}
