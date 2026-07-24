<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'school_id' => $this->school_id,

            'school' => $this->whenLoaded('school'),

            'student_enrollment_id' => $this->student_enrollment_id,

            'student_enrollment' => $this->whenLoaded('studentEnrollment'),

            'academic_session_id' => $this->academic_session_id,

            'academic_session' => $this->whenLoaded('academicSession'),

            'term_id' => $this->term_id,

            'term' => $this->whenLoaded('term'),

            'attendance_date' => $this->attendance_date,

            'status' => $this->status,

            'remarks' => $this->remarks,

            'staff_id' => $this->staff_id,

            'staff' => $this->whenLoaded('staff'),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
