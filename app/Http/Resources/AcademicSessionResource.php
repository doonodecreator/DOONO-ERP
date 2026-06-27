<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicSessionResource extends JsonResource
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
