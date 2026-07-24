<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCampaignResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'slug' => $this->slug,

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

            'is_active' => $this->is_active,

            'auto_activate' => $this->auto_activate,

            'is_running' => $this->isRunning(),

            'has_expired' => $this->hasExpired(),

            'can_still_be_used' => $this->canStillBeUsed(),

            /*
            |--------------------------------------------------------------------------
            | Plans attached to this campaign
            |--------------------------------------------------------------------------
            */

            'subscription_plans' => SubscriptionPlanResource::collection(
                $this->whenLoaded('subscriptionPlans')
            ),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
