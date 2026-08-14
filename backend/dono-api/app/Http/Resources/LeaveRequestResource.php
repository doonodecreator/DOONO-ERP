<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'staff_id' => $this->staff_id,
            'requested_by' => $this->requested_by,
            'leave_type' => $this->leave_type,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'reason' => $this->reason,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
            'reviewer_note' => $this->reviewer_note,
            'staff' => $this->whenLoaded('staff'),
            'requester' => $this->whenLoaded('requester', function () {
                return [
                    'id' => $this->requester?->id,
                    'name' => $this->requester?->name,
                ];
            }),
            'reviewer' => $this->whenLoaded('reviewer', function () {
                return [
                    'id' => $this->reviewer?->id,
                    'name' => $this->reviewer?->name,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
