<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'school_id' => $this->school_id,
            'school' => new SchoolResource($this->whenLoaded('school')),

            'academic_session_id' => $this->academic_session_id,
            'academic_session' => new AcademicSessionResource($this->whenLoaded('academicSession')),

            'term_id' => $this->term_id,
            'term' => new TermResource($this->whenLoaded('term')),

            'division_id' => $this->division_id,
            'division' => new DivisionResource($this->whenLoaded('division')),

            'class_id' => $this->class_id,
            'class' => new ClassResource($this->whenLoaded('class')),

            'name' => $this->name,
            'amount' => $this->amount,
            'category' => $this->category,
            'description' => $this->description,
            'is_active' => $this->is_active,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
