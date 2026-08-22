<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('employment_status')) {
            $status = strtolower(str_replace(['-', '_'], ' ', (string) $this->input('employment_status')));
            $map = [
                'active' => 'Active',
                'on leave' => 'On Leave',
                'suspended' => 'Suspended',
                'retired' => 'Retired',
                'resigned' => 'Resigned',
                'terminated' => 'Terminated',
            ];
            $this->merge(['employment_status' => $map[$status] ?? $this->input('employment_status')]);
        }
    }

    public function rules(): array
    {
        $staffId = $this->route('staff')->id;

        return [
            'school_id' =>
                'nullable|exists:schools,id',

            'staff_number' =>
                'sometimes|required|string|max:50|unique:staff,staff_number,' . $staffId,

            'first_name' =>
                'sometimes|required|string|max:100',

            'middle_name' =>
                'nullable|string|max:100',

            'last_name' =>
                'sometimes|required|string|max:100',

            'gender' =>
                'sometimes|required|in:Male,Female',

            'date_of_birth' =>
                'nullable|date',

            'phone' =>
                'sometimes|required|string|max:20',

            'email' =>
                'nullable|email|max:255',

            'address' =>
                'nullable|string',

            'designation' =>
                'sometimes|required|string|max:100',

            'department' =>
                'nullable|string|max:100',

            'employment_date' =>
                'sometimes|required|date',

            'basic_salary' =>
                'sometimes|required|numeric|min:0',

            'qualification' =>
                'nullable|string|max:255',

            'photo' =>
                ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],

            'employment_status' =>
                'sometimes|required|in:Active,On Leave,Suspended,Retired,Resigned,Terminated',
        ];
    }

    public function messages(): array
    {
        return [
            'staff_number.unique' =>
                'Staff number already exists.',
        ];
    }
}
