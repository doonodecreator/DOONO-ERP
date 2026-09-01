<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return [
            'staff_id' => [
                'required',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'attendance_date' => ['required', 'date'],
            'status' => [
                'required',
                Rule::in(['Present', 'Absent', 'Late', 'Excused']),
            ],
            'check_in_at' => ['nullable', 'date_format:H:i'],
            'check_out_at' => ['nullable', 'date_format:H:i', 'after:check_in_at'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

}
