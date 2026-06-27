<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization_id' => $this->organization_id,
            'organization' => $this->whenLoaded('organization'),

            'name' => $this->name,
            'short_name' => $this->short_name,

            'school_type' => $this->school_type,
            'has_primary' => $this->has_primary,
            'has_secondary' => $this->has_secondary,

            'school_code' => $this->school_code,

            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,

            'address' => $this->address,
            'logo' => $this->logo,

            'status' => $this->status,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
