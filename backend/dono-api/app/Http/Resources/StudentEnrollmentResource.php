<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentEnrollmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'student_id' => $this->student_id,
            'student' => $this->whenLoaded('student'),

            'school_id' => $this->school_id,
            'school' => $this->whenLoaded('school'),

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

            'enrollment_date' => $this->enrollment_date,

            'status' => $this->status,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
