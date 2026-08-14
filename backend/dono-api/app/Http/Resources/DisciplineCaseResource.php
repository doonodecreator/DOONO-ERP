<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DisciplineCaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'student_id' => $this->student_id,
            'case_number' => $this->case_number,
            'reported_by' => $this->reported_by,
            'incident_date' => $this->incident_date?->format('Y-m-d'),
            'category' => $this->category,
            'severity' => $this->severity,
            'description' => $this->description,
            'status' => $this->status,
            'action_taken' => $this->action_taken,
            'parent_notified' => $this->parent_notified,
            'parent_notified_at' => $this->parent_notified_at,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
            'resolution_notes' => $this->resolution_notes,
            'student' => $this->whenLoaded('student'),
            'reporter' => $this->whenLoaded('reporter', function () {
                return [
                    'id' => $this->reporter?->id,
                    'name' => $this->reporter?->name,
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
