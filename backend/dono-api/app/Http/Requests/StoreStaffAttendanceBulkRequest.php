<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffAttendanceBulkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1', 'max:500'],
            'records.*.staff_id' => [
                'required',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'records.*.status' => [
                'required',
                Rule::in(['Present', 'Absent', 'Late', 'Excused']),
            ],
            'records.*.check_in_at' => ['nullable', 'date_format:H:i'],
            'records.*.check_out_at' => [
                'nullable',
                'date_format:H:i',
            ],
            'records.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            foreach ((array) $this->input('records', []) as $index => $record) {
                $checkIn = $record['check_in_at'] ?? null;
                $checkOut = $record['check_out_at'] ?? null;

                if ($checkIn && $checkOut && $checkOut <= $checkIn) {
                    $validator->errors()->add(
                        "records.{$index}.check_out_at",
                        'The check-out time must be after the check-in time.'
                    );
                }
            }
        }];
    }

    private function currentSchoolId(): ?int
    {
        $schoolId = $this->attributes->get('current_school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        $user = $this->user();

        return $user
            ? app(CurrentContextService::class)->currentSchool($user)?->id
            : null;
    }
}
