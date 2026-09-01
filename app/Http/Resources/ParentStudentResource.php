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
            'relationship' => $this->relationship,
            'is_primary' => $this->is_primary,

            'parent' => $this->whenLoaded('parent'),
            'student' => $this->whenLoaded('student'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
