<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'platform_name' => $this->platform_name,
            'platform_email' => $this->platform_email,
            'platform_phone' => $this->platform_phone,
            'platform_logo' => $this->platform_logo,
            'trial_days' => $this->trial_days,
            'default_subscription_plan_id' => $this->default_subscription_plan_id,
            'default_currency_id' => $this->default_currency_id,
            'default_subscription_plan' => $this->whenLoaded('defaultSubscriptionPlan'),
            'default_currency' => $this->whenLoaded('defaultCurrency'),
            'allow_school_registration' => $this->allow_school_registration,
            'maintenance_mode' => $this->maintenance_mode,
            'enforce_subscriptions' => $this->enforce_subscriptions,
            'paystack_enabled' => $this->paystack_enabled,
            'stripe_enabled' => $this->stripe_enabled,
            'email_notifications' => $this->email_notifications,
            'sms_notifications' => $this->sms_notifications,
            'updated_at' => $this->updated_at,
        ];
    }
}
