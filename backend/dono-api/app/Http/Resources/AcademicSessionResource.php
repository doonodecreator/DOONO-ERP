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

            /*
            |--------------------------------------------------------------------------
            | Basic Information
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'school_id' => $this->school_id,

            'name' => $this->name,

            'start_date' => optional($this->start_date)->format('Y-m-d'),

            'end_date' => optional($this->end_date)->format('Y-m-d'),

            'is_current' => $this->is_current,

            'status' => $this->status,

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            'school' => $this->whenLoaded('school'),

            'terms_count' => $this->whenLoaded(
                'terms',
                fn () => $this->terms->count()
            ),

            'students_count' => $this->whenLoaded(
                'students',
                fn () => $this->students->count()
            ),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
