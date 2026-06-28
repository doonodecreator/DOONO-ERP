<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamScoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'student_enrollment_id' => $this->student_enrollment_id,

            'student_enrollment' => $this->whenLoaded('studentEnrollment'),

            'class_subject_id' => $this->class_subject_id,

            'class_subject' => $this->whenLoaded('classSubject'),

            'examination_id' => $this->examination_id,

            'examination' => $this->whenLoaded('examination'),

            'ca_score' => $this->ca_score,

            'exam_score' => $this->exam_score,

            'total_score' => $this->total_score,

            'grade' => $this->grade,

            'remark' => $this->remark,

            'position' => $this->position,

            'staff_id' => $this->staff_id,

            'staff' => $this->whenLoaded('staff'),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
