<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResultResource extends JsonResource
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

            'student_enrollment_id' => $this->student_enrollment_id,
            'student_enrollment' => $this->whenLoaded('studentEnrollment'),

            'subject_id' => $this->subject_id,
            'subject' => $this->whenLoaded('subject'),

            'academic_session_id' => $this->academic_session_id,
            'academic_session' => $this->whenLoaded('academicSession'),

            'term_id' => $this->term_id,
            'term' => $this->whenLoaded('term'),

            'ca_score' => $this->ca_score,

            'exam_score' => $this->exam_score,

            'total_score' => $this->total_score,

            'grade' => $this->grade,

            'remark' => $this->remark,

            'position' => $this->position,

            'is_published' => $this->is_published,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
