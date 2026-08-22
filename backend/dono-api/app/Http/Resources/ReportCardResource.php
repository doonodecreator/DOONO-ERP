<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportCardResource extends JsonResource
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

            'academic_session_id' => $this->academic_session_id,
            'academic_session' => $this->whenLoaded('academicSession'),

            'term_id' => $this->term_id,
            'term' => $this->whenLoaded('term'),

            'total_score' => $this->total_score,

            'average_score' => $this->average_score,

            'position' => $this->position,

            'overall_grade' => $this->overall_grade,

            'overall_remark' => $this->overall_remark,

            'teacher_comment' => $this->teacher_comment,

            'principal_comment' => $this->principal_comment,
            'class_teacher_name' => $this->class_teacher_name,
            'principal_name' => $this->principal_name,
            'next_term_begins' => $this->next_term_begins,
            'promotion_status' => $this->promotion_status,

            'is_published' => $this->is_published,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
