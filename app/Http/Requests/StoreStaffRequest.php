<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
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

            'school_id' => 'required|exists:schools,id',

            'staff_number' => 'required|string|max:50|unique:staff,staff_number',

            'first_name' => 'required|string|max:100',

            'middle_name' => 'nullable|string|max:100',

            'last_name' => 'required|string|max:100',

            'gender' => 'required|in:Male,Female',

            'date_of_birth' => 'nullable|date',

            'phone' => 'required|string|max:20',

            'email' => 'nullable|email|max:255',

            'address' => 'nullable|string',

            'designation' => 'required|string|max:100',

            'department' => 'nullable|string|max:100',

            'employment_date' => 'required|date',

            'basic_salary' => 'required|numeric|min:0',

            'qualification' => 'nullable|string|max:255',

            'photo' => 'nullable|string|max:255',

            'employment_status' => 'required|in:Active,Suspended,Retired,Resigned,Terminated',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'staff_number.unique' => 'Staff number already exists.',
        ];
    }
}
