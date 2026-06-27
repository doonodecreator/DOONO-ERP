<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
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
        $student = $this->route('student');

        return [

            'school_id' => 'sometimes|required|exists:schools,id',

            'division_id' => 'sometimes|required|exists:divisions,id',

            'class_id' => 'sometimes|required|exists:classes,id',

            'stream_id' => 'nullable|exists:streams,id',

            'academic_session_id' => 'sometimes|required|exists:academic_sessions,id',

            'admission_number' => 'sometimes|required|string|max:50|unique:students,admission_number,' . $student->id,

            'first_name' => 'sometimes|required|string|max:100',

            'middle_name' => 'nullable|string|max:100',

            'last_name' => 'sometimes|required|string|max:100',

            'gender' => 'sometimes|required|in:Male,Female',

            'date_of_birth' => 'sometimes|required|date',

            'admission_date' => 'sometimes|required|date',

            'photo' => 'nullable|string|max:255',

            'religion' => 'nullable|string|max:100',

            'nationality' => 'nullable|string|max:100',

            'state_of_origin' => 'nullable|string|max:100',

            'local_government' => 'nullable|string|max:100',

            'address' => 'nullable|string',

            'blood_group' => 'nullable|string|max:10',

            'genotype' => 'nullable|string|max:10',

            'medical_notes' => 'nullable|string',

            'status' => 'sometimes|required|in:Active,Graduated,Transferred,Suspended,Withdrawn',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'admission_number.unique' => 'Admission number already exists.',
            'school_id.exists' => 'Selected school does not exist.',
            'division_id.exists' => 'Selected division does not exist.',
            'class_id.exists' => 'Selected class does not exist.',
            'stream_id.exists' => 'Selected stream does not exist.',
            'academic_session_id.exists' => 'Selected academic session does not exist.',
        ];
    }
}
