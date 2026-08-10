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

            /*
            |--------------------------------------------------------------------------
            | School
            |--------------------------------------------------------------------------
            */

            'school_id' => $this->school_id,

            'school' => new SchoolResource(
                $this->whenLoaded('school')
            ),

            /*
            |--------------------------------------------------------------------------
            | Subscription Plan
            |--------------------------------------------------------------------------
            */

            'subscription_plan_id' => $this->subscription_plan_id,

            'subscription_plan' => new SubscriptionPlanResource(
                $this->whenLoaded('subscriptionPlan')
            ),

            /*
            |--------------------------------------------------------------------------
            | Subscription Dates
            |--------------------------------------------------------------------------
            */

            'start_date' => $this->start_date,

            'expiry_date' => $this->expiry_date,

            'trial_ends_at' => $this->trial_ends_at,

            'next_billing_date' => $this->next_billing_date,

            /*
            |--------------------------------------------------------------------------
            | Billing
            |--------------------------------------------------------------------------
            */

            'billing_cycle' => $this->billing_cycle,

            'currency' => $this->currency,

            'amount_paid' => $this->amount_paid,

            'base_price' => $this->basePrice(),

            'discount_percentage' => $this->discount_percentage,

            'discount_amount' => $this->discountAmount(
                $this->basePrice()
            ),

            'amount_due' => $this->effectivePrice(),

            /*
            |--------------------------------------------------------------------------
            | Discount
            |--------------------------------------------------------------------------
            */

            'discount_reason' => $this->discount_reason,

            'discount_ends_at' => $this->discount_ends_at,

            'discount_ends_on' => $this->discount_ends_on,

            'has_active_discount' => $this->hasActiveDiscount(),

            /*
            |--------------------------------------------------------------------------
            | Subscription Status
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'is_current' => $this->is_current,

            'is_exempt' => $this->is_exempt,

            'is_active' => $this->isActive(),

            'is_expired' => $this->isExpired(),

            'days_remaining' => $this->daysRemaining(),

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            'payment_reference' => $this->payment_reference,

            'auto_renew' => $this->auto_renew,

            /*
            |--------------------------------------------------------------------------
            | Exemption
            |--------------------------------------------------------------------------
            */

            'exempted_by' => $this->exempted_by,

            'exempted_by_user' => $this->whenLoaded(
                'exemptedBy',
                function () {
                    if (!$this->exemptedBy) {
                        return null;
                    }

                    return [
                        'id' => $this->exemptedBy->id,
                        'name' => $this->exemptedBy->name,
                        'email' => $this->exemptedBy->email,
                    ];
                }
            ),

            'exempted_at' => $this->exempted_at,

            /*
            |--------------------------------------------------------------------------
            | Renewal Reminders
            |--------------------------------------------------------------------------
            */

            'first_reminder_sent_at' => $this->first_reminder_sent_at,

            'second_reminder_sent_at' => $this->second_reminder_sent_at,

            'final_reminder_sent_at' => $this->final_reminder_sent_at,

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
