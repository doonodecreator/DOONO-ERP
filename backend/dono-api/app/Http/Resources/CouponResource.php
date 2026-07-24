<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'code' => $this->code,

            'description' => $this->description,

            'discount_type' => $this->discount_type,

            'discount_value' => $this->discount_value,

            'start_date' => $this->start_date,

            'end_date' => $this->end_date,

            'maximum_usage' => $this->maximum_usage,

            'times_used' => $this->times_used,

            'remaining_usage' => is_null($this->maximum_usage)
                ? null
                : max(0, $this->maximum_usage - $this->times_used),

            'maximum_usage_per_school' => $this->maximum_usage_per_school,

            'first_time_only' => $this->first_time_only,

            'is_active' => $this->is_active,

            'is_running' => $this->isRunning(),

            'can_be_used' => $this->canStillBeUsed(),

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            'subscription_plans' => SubscriptionPlanResource::collection(
                $this->whenLoaded('subscriptionPlans')
            ),

            'schools' => SchoolResource::collection(
                $this->whenLoaded('schools')
            ),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
