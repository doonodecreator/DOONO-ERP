<?php

namespace App\Http\Requests;

use App\Models\ClinicVisit;
use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSafetyIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'subject_type' => ['required', Rule::in(['Student', 'Staff', 'Visitor', 'Other'])],
            'student_id' => [
                'nullable',
                'integer',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'staff_id' => [
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'visitor_id' => [
                'nullable',
                'integer',
                Rule::exists('visitors', 'id')->where('school_id', $schoolId),
            ],
            'other_subject_name' => ['nullable', 'string', 'max:255'],
            'clinic_visit_id' => [
                'nullable',
                'integer',
                Rule::exists('clinic_visits', 'id')->where('school_id', $schoolId),
            ],
            'incident_at' => ['required', 'date', 'before_or_equal:now'],
            'category' => [
                'required',
                Rule::in([
                    'Injury',
                    'Illness',
                    'Fire or Evacuation',
                    'Hazard',
                    'Security',
                    'Transport',
                    'Facility',
                    'Other',
                ]),
            ],
            'severity' => ['required', Rule::in(['Low', 'Moderate', 'High', 'Critical'])],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:4000'],
            'immediate_action' => ['nullable', 'string', 'max:4000'],
            'requires_medical_attention' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            $subjectType = $this->input('subject_type');
            $studentId = $this->input('student_id');
            $staffId = $this->input('staff_id');
            $visitorId = $this->input('visitor_id');
            $otherName = trim((string) $this->input('other_subject_name'));

            $expected = match ($subjectType) {
                'Student' => $studentId,
                'Staff' => $staffId,
                'Visitor' => $visitorId,
                'Other' => $otherName,
                default => null,
            };

            if (!$expected) {
                $validator->errors()->add('subject_type', 'Provide the matching subject for the selected subject type.');
            }

            $otherSubjectFields = match ($subjectType) {
                'Student' => [$staffId, $visitorId, $otherName],
                'Staff' => [$studentId, $visitorId, $otherName],
                'Visitor' => [$studentId, $staffId, $otherName],
                'Other' => [$studentId, $staffId, $visitorId],
                default => [],
            };

            if (collect($otherSubjectFields)->filter(fn ($value) => filled($value))->isNotEmpty()) {
                $validator->errors()->add('subject_type', 'Provide only the subject that matches the selected subject type.');
            }

            if ($this->filled('clinic_visit_id')) {
                $clinicVisit = ClinicVisit::find($this->input('clinic_visit_id'));

                if ($subjectType !== 'Student' || !$studentId || !$clinicVisit || $clinicVisit->student_id !== (int) $studentId) {
                    $validator->errors()->add('clinic_visit_id', 'A clinic visit may be linked only to the matching student incident.');
                }
            }
        }];
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
