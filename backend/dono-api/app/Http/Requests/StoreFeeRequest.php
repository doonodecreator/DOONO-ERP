<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->attributes->get('current_school_id')
            ?? app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'academic_session_id' => [
                'required',
                Rule::exists('academic_sessions', 'id')->where('school_id', $schoolId),
            ],
            'term_id' => [
                'required',
                Rule::exists('terms', 'id')->whereIn('academic_session_id', function ($query) use ($schoolId) {
                    $query->select('id')->from('academic_sessions')->where('school_id', $schoolId);
                }),
            ],
            'division_id' => [
                'required',
                Rule::exists('divisions', 'id')->where('school_id', $schoolId),
            ],
            'class_id' => [
                'required',
                Rule::exists('classes', 'id')->whereIn('division_id', function ($query) use ($schoolId) {
                    $query->select('id')->from('divisions')->where('school_id', $schoolId);
                }),
            ],
            'name' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_session_id.required' => 'Academic session is required.',
            'academic_session_id.exists' => 'Selected academic session does not belong to the active school.',
            'term_id.required' => 'Term is required.',
            'term_id.exists' => 'Selected term does not belong to the active school.',
            'division_id.required' => 'Division is required.',
            'division_id.exists' => 'Selected division does not belong to the active school.',
            'class_id.required' => 'Class is required.',
            'class_id.exists' => 'Selected class does not belong to the active school.',
            'amount.required' => 'Fee amount is required.',
            'amount.numeric' => 'Fee amount must be numeric.',
        ];
    }
}
