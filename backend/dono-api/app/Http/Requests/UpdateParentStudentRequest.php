<?php

namespace App\Http\Requests;

use App\Models\ParentStudent;
use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParentStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->currentSchoolId() !== null;
    }

    protected function prepareForValidation(): void
    {
        $link = $this->route('parent_student');

        if (! $link instanceof ParentStudent) {
            return;
        }

        $this->merge([
            'parent_id' => $this->input('parent_id', $link->parent_id),
            'student_id' => $this->input('student_id', $link->student_id),
            'relationship_type' => $this->input(
                'relationship_type',
                $link->relationship_type
            ),
        ]);
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();
        $link = $this->route('parent_student');
        $studentId = $this->input('student_id');

        return [
            'parent_id' => [
                'required',
                'integer',
                Rule::exists('parents', 'id')->where('school_id', $schoolId),
                Rule::unique('parent_student', 'parent_id')
                    ->ignore($link?->id)
                    ->where('student_id', $studentId),
            ],
            'student_id' => [
                'required',
                'integer',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'relationship_type' => [
                'nullable',
                'string',
                'max:50',
                Rule::in([
                    'Father',
                    'Mother',
                    'Guardian',
                    'Uncle',
                    'Aunt',
                    'Other',
                ]),
            ],
            'is_primary_contact' => 'sometimes|boolean',
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
