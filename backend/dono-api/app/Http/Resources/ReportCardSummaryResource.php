<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportCardSummaryResource extends JsonResource
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
            'total_score' => $this->total_score,
            'average_score' => $this->student_average,
            'position' => $this->position,
            'overall_grade' => $this->overall_grade,
            'overall_remark' => $this->overall_remark,
            'teacher_comment' => $this->class_teacher_remark,
            'principal_comment' => $this->principal_remark,
            'promotion_status' => $this->promotion_status,
            'is_published' => $this->is_published,
            'approved_at' => $this->approved_at,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
