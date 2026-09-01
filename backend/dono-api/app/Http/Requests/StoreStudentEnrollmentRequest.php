<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'student_id' => [
                'required',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
                Rule::unique('student_enrollments', 'student_id')->where(function ($query) use ($schoolId): void {
                    $query->where('school_id', $schoolId)
                        ->where('academic_session_id', $this->input('academic_session_id'))
                        ->where('term_id', $this->input('term_id'));
                }),
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
            'enrollment_date' => 'required|date',
            'status' => ['prohibited'],
        ];
    }

}
