<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $student = $this->route('student');
        $schoolId = $this->currentSchoolId();

        return [
            'admission_number' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('students', 'admission_number')
                    ->ignore($student?->id)
                    ->where('school_id', $schoolId),
            ],
            'first_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'gender' => ['sometimes', 'required', Rule::in(['Male', 'Female'])],
            'date_of_birth' => 'sometimes|required|date',
            'admission_date' => 'sometimes|required|date',
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'religion' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'state_of_origin' => 'nullable|string|max:255',
            'local_government' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'medical_notes' => 'nullable|string',
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'Active',
                    'Graduated',
                    'Transferred',
                    'Suspended',
                    'Withdrawn',
                ]),
            ],
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
