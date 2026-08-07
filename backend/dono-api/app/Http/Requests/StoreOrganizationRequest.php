<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrganizationRequest extends FormRequest
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
            'name' => trim((string) $this->name),
            'short_name' => $this->short_name ? trim((string) $this->short_name) : null,
            'registration_number' => $this->registration_number ? trim((string) $this->registration_number) : null,
            'email' => $this->email ? strtolower(trim((string) $this->email)) : null,
            'website' => $this->website ? trim((string) $this->website) : null,
            'country' => trim((string) $this->country),
            'state' => trim((string) $this->state),
            'lga' => trim((string) $this->lga),
        ]);
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:organizations,name',
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
                'unique:organizations,registration_number',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:organizations,email',
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
                'required',
                'string',
                'max:100',
            ],

            'state' => [
                'required',
                'string',
                'max:100',
            ],

            'lga' => [
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
                'nullable',
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
                'Please provide a valid email address.',

            'email.unique' =>
                'This email address is already being used.',

            'website.url' =>
                'Please provide a valid website URL.',

            'country.required' =>
                'Country is required.',

            'state.required' =>
                'State is required.',

            'lga.required' =>
                'Local Government Area is required.',

            'status.in' =>
                'Status must be active, inactive, or suspended.',
        ];
    }

    /**
     * Default values.
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated();

        if (empty($data['status'])) {
            $data['status'] = 'active';
        }

        return $data;
    }
}
