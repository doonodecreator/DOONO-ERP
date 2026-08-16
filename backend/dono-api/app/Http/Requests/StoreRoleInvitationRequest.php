<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'gender' => ['required', Rule::in(['Male', 'Female', 'male', 'female'])],
            'designation' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'staff_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('staff', 'staff_number'),
            ],
            'employment_date' => ['nullable', 'date'],
            'role_slug' => [
                'required',
                'string',
                Rule::exists('roles', 'slug')->whereNotIn('slug', [
                    'super_admin',
                    'student',
                    'parent',
                    'organization_owner',
                    'proprietor',
                ]),
            ],
        ];
    }
}
