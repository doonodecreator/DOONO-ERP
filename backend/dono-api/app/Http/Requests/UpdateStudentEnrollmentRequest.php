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
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'student_id' => ['prohibited'],
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
            'status' => ['prohibited'],
        ];
    }

}
