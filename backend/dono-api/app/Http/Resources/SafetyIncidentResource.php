<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SafetyIncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'incident_number' => $this->incident_number,
            'subject_type' => $this->subject_type,
            'student_id' => $this->student_id,
            'staff_id' => $this->staff_id,
            'visitor_id' => $this->visitor_id,
            'other_subject_name' => $this->other_subject_name,
            'subject_label' => $this->subject_label,
            'clinic_visit_id' => $this->clinic_visit_id,
            'reported_by' => $this->reported_by,
            'incident_at' => $this->incident_at,
            'category' => $this->category,
            'severity' => $this->severity,
            'location' => $this->location,
            'description' => $this->description,
            'immediate_action' => $this->immediate_action,
            'requires_medical_attention' => $this->requires_medical_attention,
            'guardian_contacted' => $this->guardian_contacted,
            'guardian_contacted_at' => $this->guardian_contacted_at,
            'emergency_services_contacted' => $this->emergency_services_contacted,
            'emergency_services_contacted_at' => $this->emergency_services_contacted_at,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at,
            'resolution_notes' => $this->resolution_notes,
            'student' => $this->whenLoaded('student'),
            'staff' => $this->whenLoaded('staff'),
            'visitor' => $this->whenLoaded('visitor'),
            'clinic_visit' => $this->whenLoaded('clinicVisit'),
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
