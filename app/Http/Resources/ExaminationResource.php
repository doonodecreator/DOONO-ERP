<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExaminationResource extends JsonResource
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

            'academic_session_id' => $this->academic_session_id,

            'academic_session' => $this->whenLoaded('academicSession'),

            'term_id' => $this->term_id,

            'term' => $this->whenLoaded('term'),

            'name' => $this->name,

            'exam_type' => $this->exam_type,

            'total_marks' => $this->total_marks,

            'start_date' => $this->start_date,

            'end_date' => $this->end_date,

            'status' => $this->status,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
