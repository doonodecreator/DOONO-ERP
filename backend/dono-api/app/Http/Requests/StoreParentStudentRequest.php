<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreParentStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->currentSchoolId() !== null;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();
        $studentId = $this->input('student_id');

        return [
            'parent_id' => [
                'required',
                'integer',
                Rule::exists('parents', 'id')->where('school_id', $schoolId),
                Rule::unique('parent_student', 'parent_id')->where(
                    'student_id',
                    $studentId
                ),
            ],
            'student_id' => [
                'required',
                'integer',
                Rule::exists('students', 'id')->where('school_id', $schoolId),
            ],
            'relationship_type' => [
                'required',
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

    public function messages(): array
    {
        return [
            'parent_id.exists' => 'The selected parent is not in the active school.',
            'student_id.exists' => 'The selected student is not in the active school.',
            'parent_id.unique' => 'This student is already linked to the selected parent.',
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
