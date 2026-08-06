<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = auth()->user();
        $schoolId = method_exists($user, 'currentSchoolId') ? $user->currentSchoolId() : $user->school_id;

        return [
            'school_id' => 'nullable|integer|exists:schools,id',
            'staff_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('staff')->where(function ($query) use ($schoolId) {
                    return $query->where('school_id', $schoolId);
                }),
            ],
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Other', 'male', 'female'])],
            'date_of_birth' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'employment_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'qualification' => 'nullable|string|max:255',
            'photo' => 'nullable|string',
            'employment_status' => ['nullable', Rule::in(['active', 'on_leave', 'suspended', 'terminated', 'resigned'])],
        ];
    }
}

