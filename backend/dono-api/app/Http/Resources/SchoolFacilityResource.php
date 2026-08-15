<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolFacilityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'category' => $this->category,
            'location' => $this->location,
            'condition' => $this->condition,
            'status' => $this->status,
            'description' => $this->description,
            'last_inspected_at' => $this->last_inspected_at,
            'next_inspection_at' => $this->next_inspection_at,
            'responsible_staff_id' => $this->responsible_staff_id,
            'notes' => $this->notes,
            'school' => $this->whenLoaded('school'),
            'responsible_staff' => $this->whenLoaded('responsibleStaff', function () {
                return [
                    'id' => $this->responsibleStaff?->id,
                    'full_name' => $this->responsibleStaff?->full_name,
                    'staff_number' => $this->responsibleStaff?->staff_number,
                ];
            }),
            'creator' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator?->id,
                    'name' => $this->creator?->name,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
