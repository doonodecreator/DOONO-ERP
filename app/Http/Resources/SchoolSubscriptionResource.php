<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolSubscriptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'school_id' => $this->school_id,

            'school' => new SchoolResource(
                $this->whenLoaded('school')
            ),

            'subscription_plan_id' => $this->subscription_plan_id,

            'subscription_plan' => new SubscriptionPlanResource(
                $this->whenLoaded('subscriptionPlan')
            ),

            'start_date' => $this->start_date,

            'expiry_date' => $this->expiry_date,

            'trial_ends_at' => $this->trial_ends_at,

            'next_billing_date' => $this->next_billing_date,

            'billing_cycle' => $this->billing_cycle,

            'status' => $this->status,

            'amount_paid' => $this->amount_paid,

            'currency' => $this->currency,

            'payment_reference' => $this->payment_reference,

            'auto_renew' => $this->auto_renew,

            'is_current' => $this->is_current,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
