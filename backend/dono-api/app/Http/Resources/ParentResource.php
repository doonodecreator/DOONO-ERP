<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'display_name' => $this->display_name,
            'father_name' => $this->father_name,
            'father_phone' => $this->father_phone,
            'father_email' => $this->father_email,
            'father_occupation' => $this->father_occupation,
            'mother_name' => $this->mother_name,
            'mother_phone' => $this->mother_phone,
            'mother_email' => $this->mother_email,
            'mother_occupation' => $this->mother_occupation,
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => $this->guardian_phone,
            'guardian_email' => $this->guardian_email,
            'guardian_occupation' => $this->guardian_occupation,
            'guardian_relationship' => $this->guardian_relationship,
            'address' => $this->address,
            'school' => $this->whenLoaded('school'),
            'students' => StudentResource::collection($this->whenLoaded('students')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

