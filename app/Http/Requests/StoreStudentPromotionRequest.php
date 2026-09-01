<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentPromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [

            'student_id' => 'required|exists:students,id',

            'from_academic_session_id' => 'required|exists:academic_sessions,id',
            'to_academic_session_id' => 'required|exists:academic_sessions,id',

            'from_division_id' => 'required|exists:divisions,id',
            'to_division_id' => 'required|exists:divisions,id',

            'from_class_id' => 'required|exists:classes,id',
            'to_class_id' => 'required|exists:classes,id',

            'from_stream_id' => 'nullable|exists:streams,id',
            'to_stream_id' => 'nullable|exists:streams,id',

            'promotion_date' => 'required|date',

            'promotion_status' => 'required|in:Promoted,Repeated,Transferred,Graduated',

            'remarks' => 'nullable|string',
        ];

        if ($this->user()->isSuperAdmin()) {
            $rules['school_id'] = 'required|exists:schools,id';
        }

        return $rules;
    }
}
