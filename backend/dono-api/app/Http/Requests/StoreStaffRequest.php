<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
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
        $resolved = app(CurrentContextService::class)->resolve($user);
        $schoolId = $resolved['school']['id'] ?? null;

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
            'address' => 'nullable|string',
            'designation' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'employment_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'qualification' => 'nullable|string|max:255',
            'photo' => 'nullable|string',
            'employment_status' => ['nullable', Rule::in(['active', 'on_leave', 'suspended', 'terminated', 'resigned'])],

            // Login + role — creates a real User account for this staff
            // member, scoped to the current school.
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role_slug' => [
                'required',
                'string',
                Rule::exists('roles', 'slug')->whereNotIn('slug', ['super_admin', 'student', 'parent']),
            ],
        ];
    }
}
