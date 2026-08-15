<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'event_type' => ['sometimes', 'required', Rule::in([
                'Academic', 'Sports', 'Meeting', 'Cultural', 'Examination', 'Holiday', 'Other',
            ])],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'start_at' => ['sometimes', 'required', 'date'],
            'end_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_at'],
            'venue' => ['sometimes', 'nullable', 'string', 'max:255'],
            'organizer_staff_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'audience' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'required', Rule::in([
                'Planned', 'Ongoing', 'Completed', 'Cancelled',
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
