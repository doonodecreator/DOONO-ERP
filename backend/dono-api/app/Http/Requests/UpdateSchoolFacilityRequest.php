<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolFacilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', Rule::in([
                'Classroom', 'Office', 'Laboratory', 'Sports', 'Sanitation', 'Security', 'Other',
            ])],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'condition' => ['sometimes', 'required', Rule::in(['New', 'Good', 'Fair', 'Poor', 'Critical'])],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'last_inspected_at' => ['sometimes', 'nullable', 'date'],
            'next_inspection_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:last_inspected_at'],
            'responsible_staff_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'status' => ['sometimes', 'required', Rule::in([
                'Operational', 'Under Maintenance', 'Unavailable', 'Decommissioned',
            ])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }

    private function currentSchoolId(): ?int
    {
        $schoolId = $this->attributes->get('current_school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        $user = $this->user();

        return $user
            ? app(CurrentContextService::class)->currentSchool($user)?->id
            : null;
    }
}
