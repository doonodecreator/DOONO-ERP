<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Services\CurrentContextService;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();
        $schoolId = $this->attributes->get('current_school_id')
            ?? ($user ? app(CurrentContextService::class)->currentSchool($user)?->id : null);

        return [
            'admission_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('students')->where(function ($query) use ($schoolId) {
                    return $query->where('school_id', $schoolId);
                }),
            ],
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => ['required', Rule::in(['Male', 'Female', 'Other', 'male', 'female'])],
            'division_id' => [
                'nullable',
                Rule::exists('divisions', 'id')->where('school_id', $schoolId),
            ],
            'class_id' => [
                'required',
                Rule::exists('classes', 'id')->where(function ($query) use ($schoolId) {
                    $query->whereHas('division', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }),
            ],
            'stream_id' => [
                'nullable',
                Rule::exists('streams', 'id')->where(function ($query) use ($schoolId) {
                    $query->whereHas('class.division', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }),
            ],
            'academic_session_id' => [
                'nullable',
                Rule::exists('academic_sessions', 'id')->where('school_id', $schoolId),
            ],
            'date_of_birth' => 'nullable|date',
            'admission_date' => 'nullable|date',
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'religion' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'state_of_origin' => 'nullable|string|max:255',
            'local_government' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'medical_notes' => 'nullable|string',
            'status' => ['nullable', Rule::in(['active', 'graduated', 'suspended', 'withdrawn', 'transferred'])],
        ];
    }
}

