<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentPromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'student_id' => $this->student_id,
            'student' => $this->whenLoaded('student'),

            'school_id' => $this->school_id,
            'school' => $this->whenLoaded('school'),

            'from_academic_session_id' => $this->from_academic_session_id,
            'from_academic_session' => $this->whenLoaded('fromAcademicSession'),

            'to_academic_session_id' => $this->to_academic_session_id,
            'to_academic_session' => $this->whenLoaded('toAcademicSession'),

            'from_division_id' => $this->from_division_id,
            'from_division' => $this->whenLoaded('fromDivision'),

            'to_division_id' => $this->to_division_id,
            'to_division' => $this->whenLoaded('toDivision'),

            'from_class_id' => $this->from_class_id,
            'from_class' => $this->whenLoaded('fromClass'),

            'to_class_id' => $this->to_class_id,
            'to_class' => $this->whenLoaded('toClass'),

            'from_stream_id' => $this->from_stream_id,
            'from_stream' => $this->whenLoaded('fromStream'),

            'to_stream_id' => $this->to_stream_id,
            'to_stream' => $this->whenLoaded('toStream'),

            'promotion_date' => $this->promotion_date,

            'promotion_status' => $this->promotion_status,

            'remarks' => $this->remarks,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

        ];
    }
}
