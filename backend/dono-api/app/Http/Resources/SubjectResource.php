<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'school_id' => $this->school_id,

            'division_id' => $this->division_id,

            'school' => $this->whenLoaded('school'),

            'division' => $this->whenLoaded('division'),

            'classes' => ClassResource::collection(
                $this->whenLoaded('classes')
            ),

            'name' => $this->name,

            'code' => $this->code,

            'category' => $this->category,

            'pass_mark' => $this->pass_mark,

            'maximum_mark' => $this->maximum_mark,

            'is_active' => $this->is_active,

            'description' => $this->description,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
