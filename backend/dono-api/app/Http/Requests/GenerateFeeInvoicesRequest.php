<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateFeeInvoicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'fee_id' => [
                'required',
                Rule::exists('fees', 'id')->where('school_id', $schoolId),
            ],
            'class_id' => [
                'required',
                Rule::exists('classes', 'id')->where(function ($query) use ($schoolId): void {
                    $query->whereIn('division_id', function ($divisionQuery) use ($schoolId): void {
                        $divisionQuery->select('id')->from('divisions')->where('school_id', $schoolId);
                    });
                }),
            ],
            'academic_session_id' => [
                'required',
                Rule::exists('academic_sessions', 'id')->where('school_id', $schoolId),
            ],
            'term_id' => [
                'required',
                Rule::exists('terms', 'id')->whereIn('academic_session_id', function ($query) use ($schoolId): void {
                    $query->select('id')->from('academic_sessions')->where('school_id', $schoolId);
                }),
            ],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'fee_id.exists' => 'The selected fee structure does not belong to the active school.',
            'class_id.exists' => 'The selected class does not belong to the active school.',
            'academic_session_id.exists' => 'The selected academic session does not belong to the active school.',
            'term_id.exists' => 'The selected term does not belong to the active school.',
        ];
    }
}
