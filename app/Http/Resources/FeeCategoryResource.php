<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeeCategoryResource extends JsonResource
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

            'code' => $this->code,

            'description' => $this->description,

            'default_amount' => $this->default_amount,

            'frequency' => $this->frequency,

            'is_mandatory' => $this->is_mandatory,

            'is_active' => $this->is_active,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

        ];
    }
}
