<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisciplineCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'student_id' => [
                'required',
                'integer',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'incident_date' => ['required', 'date', 'before_or_equal:today'],
            'category' => [
                'required',
                Rule::in([
                    'Bullying',
                    'Disrespect',
                    'Violence',
                    'Theft',
                    'Harassment',
                    'Academic Misconduct',
                    'Property Damage',
                    'Absenteeism',
                    'Other',
                ]),
            ],
            'severity' => ['required', Rule::in(['Minor', 'Major', 'Critical'])],
            'description' => ['required', 'string', 'max:4000'],
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
