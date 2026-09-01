<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [
            'school_id' => 'required|exists:schools,id',

            'division_id' => 'required|exists:divisions,id',

            'class_id' => 'required|exists:classes,id',

            'stream_id' => 'nullable|exists:streams,id',

            'academic_session_id' => 'required|exists:academic_sessions,id',

            'admission_number' => 'required|string|max:50|unique:students,admission_number',

            'first_name' => 'required|string|max:100',

            'middle_name' => 'nullable|string|max:100',

            'last_name' => 'required|string|max:100',

            'gender' => 'required|in:Male,Female',

            'date_of_birth' => 'required|date',

            'admission_date' => 'required|date',

            'photo' => 'nullable|string|max:255',

            'religion' => 'nullable|string|max:100',

            'nationality' => 'nullable|string|max:100',

            'state_of_origin' => 'nullable|string|max:100',

            'local_government' => 'nullable|string|max:100',

            'address' => 'nullable|string',

            'blood_group' => 'nullable|string|max:10',

            'genotype' => 'nullable|string|max:10',

            'medical_notes' => 'nullable|string',

            'status' => 'required|in:Active,Graduated,Transferred,Suspended,Withdrawn',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'school_id.required' => 'School is required.',
            'division_id.required' => 'Division is required.',
            'class_id.required' => 'Class is required.',
            'academic_session_id.required' => 'Academic session is required.',
            'admission_number.required' => 'Admission number is required.',
            'admission_number.unique' => 'Admission number already exists.',
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'gender.required' => 'Gender is required.',
            'date_of_birth.required' => 'Date of birth is required.',
            'admission_date.required' => 'Admission date is required.',
        ];
    }
}
