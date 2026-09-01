<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolFacilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in([
                'Classroom', 'Office', 'Laboratory', 'Sports', 'Sanitation', 'Security', 'Other',
            ])],
            'location' => ['nullable', 'string', 'max:255'],
            'condition' => ['required', Rule::in(['New', 'Good', 'Fair', 'Poor', 'Critical'])],
            'description' => ['nullable', 'string', 'max:5000'],
            'last_inspected_at' => ['nullable', 'date'],
            'next_inspection_at' => ['nullable', 'date', 'after_or_equal:last_inspected_at'],
            'responsible_staff_id' => [
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

}
