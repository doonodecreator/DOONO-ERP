<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => ['required', Rule::in(['Male', 'Female'])],
            'date_of_birth' => 'required|date',
            'admission_date' => 'required|date',
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
            'academic_session_id' => [
                'required',
                Rule::exists('academic_sessions', 'id')->where(
                    'school_id',
                    $schoolId
                ),
            ],
            'term_id' => [
                'required',
                Rule::exists('terms', 'id')->where(
                    'academic_session_id',
                    $this->input('academic_session_id')
                ),
            ],
            'enrollment_date' => 'required|date',
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'religion' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'state_of_origin' => 'nullable|string|max:255',
            'local_government' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'medical_notes' => 'nullable|string',
        ];
    }

}
