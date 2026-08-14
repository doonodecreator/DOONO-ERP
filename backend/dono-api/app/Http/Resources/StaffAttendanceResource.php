<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'staff_id' => $this->staff_id,
            'attendance_date' => $this->attendance_date?->format('Y-m-d'),
            'status' => $this->status,
            'check_in_at' => $this->check_in_at,
            'check_out_at' => $this->check_out_at,
            'remarks' => $this->remarks,
            'recorded_by' => $this->recorded_by,
            'staff' => $this->whenLoaded('staff'),
            'recorder' => $this->whenLoaded('recorder', function () {
                return [
                    'id' => $this->recorder?->id,
                    'name' => $this->recorder?->name,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
