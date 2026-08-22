<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimetableResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'school_id' => $this->school_id,
            'school' => $this->whenLoaded('school'),
            'entry_type' => $this->entry_type ?? 'lesson',
            'schedule_mode' => $this->schedule_mode ?? 'weekly',
            'target_type' => $this->target_type ?? 'class',

            'academic_session_id' => $this->academic_session_id,
            'academic_session' => $this->whenLoaded('academicSession'),

            'term_id' => $this->term_id,
            'term' => $this->whenLoaded('term'),

            'division_id' => $this->division_id,
            'division' => $this->whenLoaded('division'),

            'class_id' => $this->class_id,
            'class' => $this->whenLoaded('class'),

            'stream_id' => $this->stream_id,
            'stream' => $this->whenLoaded('stream'),

            'subject_id' => $this->subject_id,
            'subject' => $this->whenLoaded('subject'),
            'title' => $this->title,
            'description' => $this->description,

            'staff_id' => $this->staff_id,
            'staff' => $this->whenLoaded('staff'),

            'day_of_week' => $this->day_of_week,

            'start_time' => $this->start_time,

            'end_time' => $this->end_time,
            'event_date' => $this->event_date?->toDateString(),
            'effective_from' => $this->effective_from?->toDateString(),
            'effective_until' => $this->effective_until?->toDateString(),

            'room' => $this->room,

            'is_active' => $this->is_active,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
