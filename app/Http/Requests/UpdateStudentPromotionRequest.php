<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentPromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [

            'student_id' => 'sometimes|exists:students,id',

            'from_academic_session_id' => 'sometimes|exists:academic_sessions,id',
            'to_academic_session_id' => 'sometimes|exists:academic_sessions,id',

            'from_division_id' => 'sometimes|exists:divisions,id',
            'to_division_id' => 'sometimes|exists:divisions,id',

            'from_class_id' => 'sometimes|exists:classes,id',
            'to_class_id' => 'sometimes|exists:classes,id',

            'from_stream_id' => 'nullable|exists:streams,id',
            'to_stream_id' => 'nullable|exists:streams,id',

            'promotion_date' => 'sometimes|date',

            'promotion_status' => 'sometimes|in:Promoted,Repeated,Transferred,Graduated',

            'remarks' => 'nullable|string',
        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'sometimes|required|exists:schools,id';
        }

        return $rules;
    }
}
