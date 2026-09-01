<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
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

            'name' => $this->name,

            'slug' => $this->slug,

            'description' => $this->description,

            'monthly_price' => $this->monthly_price,

            'quarterly_price' => $this->quarterly_price,

            'half_yearly_price' => $this->half_yearly_price,

            'yearly_price' => $this->yearly_price,

            'currency' => $this->currency,

            'max_students' => $this->max_students,

            'max_staff' => $this->max_staff,

            'max_branches' => $this->max_branches,

            'features' => $this->features,

            'trial_days' => $this->trial_days,

            'is_active' => $this->is_active,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
