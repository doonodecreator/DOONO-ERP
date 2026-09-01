<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
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

            'title' => $this->title,

            'message' => $this->message,

            'type' => $this->type,

            'is_read' => $this->is_read,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
