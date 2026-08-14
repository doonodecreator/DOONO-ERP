<?php

namespace App\Http\Requests;

use App\Models\StudentEnrollment;
use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentEnrollmentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $enrollment = $this->route('studentEnrollment');

        if (! $enrollment instanceof StudentEnrollment) {
            return;
        }

        $this->merge([
            'student_id' => $this->input('student_id', $enrollment->student_id),
            'academic_session_id' => $this->input(
                'academic_session_id',
                $enrollment->academic_session_id
            ),
            'term_id' => $this->input('term_id', $enrollment->term_id),
            'division_id' => $this->input('division_id', $enrollment->division_id),
            'class_id' => $this->input('class_id', $enrollment->class_id),
            'stream_id' => $this->input('stream_id', $enrollment->stream_id),
        ]);
    }

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
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'academic_session_id' => [
                'required',
                Rule::exists('academic_sessions', 'id')->where('school_id', $schoolId),
            ],
            'term_id' => [
                'required',
                Rule::exists('terms', 'id')->where(
                    'academic_session_id',
                    $this->input('academic_session_id')
                ),
            ],
            'division_id' => [
                'required',
                Rule::exists('divisions', 'id')->where('school_id', $schoolId),
            ],
            'class_id' => [
                'required',
                Rule::exists('classes', 'id')->where(
                    'division_id',
                    $this->input('division_id')
                ),
            ],
            'stream_id' => [
                'nullable',
                Rule::exists('streams', 'id')->where(
                    'class_id',
                    $this->input('class_id')
                ),
            ],
            'enrollment_date' => 'sometimes|date',
            'status' => [
                'sometimes',
                Rule::in([
                    'Active',
                    'Promoted',
                    'Repeated',
                    'Graduated',
                    'Transferred',
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
