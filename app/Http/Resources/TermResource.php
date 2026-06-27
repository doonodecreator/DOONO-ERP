<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TermResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'academic_session_id' => $this->academic_session_id,

            'academic_session' => $this->whenLoaded('academicSession'),

            'name' => $this->name,

            'start_date' => $this->start_date,

            'end_date' => $this->end_date,

            'is_current' => $this->is_current,

            'status' => $this->status,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
