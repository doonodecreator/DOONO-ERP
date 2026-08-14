<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'sometimes',
                'required',
                Rule::in(['Present', 'Absent', 'Late', 'Excused']),
            ],
            'check_in_at' => ['nullable', 'date_format:H:i'],
            'check_out_at' => ['nullable', 'date_format:H:i'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            $attendance = $this->route('staff_attendance');
            $checkIn = $this->input('check_in_at', $attendance?->check_in_at);
            $checkOut = $this->input('check_out_at', $attendance?->check_out_at);

            if ($checkIn && $checkOut && $checkOut <= $checkIn) {
                $validator->errors()->add(
                    'check_out_at',
                    'The check-out time must be after the check-in time.'
                );
            }
        }];
    }
}
