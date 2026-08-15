<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'title' => $this->title,
            'event_type' => $this->event_type,
            'description' => $this->description,
            'start_at' => $this->start_at,
            'end_at' => $this->end_at,
            'venue' => $this->venue,
            'organizer_staff_id' => $this->organizer_staff_id,
            'audience' => $this->audience,
            'status' => $this->status,
            'notes' => $this->notes,
            'school' => $this->whenLoaded('school'),
            'organizer' => $this->whenLoaded('organizer', function () {
                return [
                    'id' => $this->organizer?->id,
                    'full_name' => $this->organizer?->full_name,
                    'staff_number' => $this->organizer?->staff_number,
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
