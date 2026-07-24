<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentStudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'parent_id' => $this->parent_id,

            'student_id' => $this->student_id,

            'is_primary_contact' => $this->is_primary_contact,

            'parent' => $this->whenLoaded('parent', function () {
                return [
                    'id' => $this->parent->id,
                    'father_name' => $this->parent->father_name,
                    'mother_name' => $this->parent->mother_name,
                    'guardian_name' => $this->parent->guardian_name,
                ];
            }),

            'student' => $this->whenLoaded('student', function () {
                return [
                    'id' => $this->student->id,
                    'admission_number' => $this->student->admission_number,
                    'first_name' => $this->student->first_name,
                    'middle_name' => $this->student->middle_name,
                    'last_name' => $this->student->last_name,
                    'full_name' => $this->student->full_name,
                ];
            }),
        ];
    }
}
