<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeeRequest extends FormRequest
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
            'academic_session_id' => ['sometimes', 'required', Rule::exists('academic_sessions', 'id')->where('school_id', $schoolId)],
            'term_id' => ['sometimes', 'required', Rule::exists('terms', 'id')->whereIn('academic_session_id', function ($query) use ($schoolId) { $query->select('id')->from('academic_sessions')->where('school_id', $schoolId); })],
            'division_id' => ['sometimes', 'required', Rule::exists('divisions', 'id')->where('school_id', $schoolId)],
            'class_id' => ['sometimes', 'required', Rule::exists('classes', 'id')->whereIn('division_id', function ($query) use ($schoolId) { $query->select('id')->from('divisions')->where('school_id', $schoolId); })],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'academic_session_id.exists' => 'Selected academic session does not belong to the active school.',
            'term_id.exists' => 'Selected term does not belong to the active school.',
            'division_id.exists' => 'Selected division does not belong to the active school.',
            'class_id.exists' => 'Selected class does not belong to the active school.',
            'amount.numeric' => 'Fee amount must be numeric.',
        ];
    }
}
