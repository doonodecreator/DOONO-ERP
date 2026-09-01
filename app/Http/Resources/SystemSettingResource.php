<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemSettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Platform
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'platform_name' => $this->platform_name,

            'platform_email' => $this->platform_email,

            'platform_phone' => $this->platform_phone,

            'platform_logo' => $this->platform_logo,

            /*
            |--------------------------------------------------------------------------
            | Trial
            |--------------------------------------------------------------------------
            */

            'trial_days' => $this->trial_days,

            'default_subscription_plan' => $this->whenLoaded(
                'defaultSubscriptionPlan',
                function () {

                    return [

                        'id' => $this->defaultSubscriptionPlan->id,

                        'name' => $this->defaultSubscriptionPlan->name,

                        'slug' => $this->defaultSubscriptionPlan->slug,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Currency
            |--------------------------------------------------------------------------
            */

            'default_currency' => $this->whenLoaded(
                'defaultCurrency',
                function () {

                    return [

                        'id' => $this->defaultCurrency->id,

                        'name' => $this->defaultCurrency->name,

                        'code' => $this->defaultCurrency->code,

                        'symbol' => $this->defaultCurrency->symbol,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Registration
            |--------------------------------------------------------------------------
            */

            'allow_school_registration' => $this->allow_school_registration,

            /*
            |--------------------------------------------------------------------------
            | Maintenance
            |--------------------------------------------------------------------------
            */

            'maintenance_mode' => $this->maintenance_mode,

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            'paystack_enabled' => $this->paystack_enabled,

            'stripe_enabled' => $this->stripe_enabled,

            /*
            |--------------------------------------------------------------------------
            | Notifications
            |--------------------------------------------------------------------------
            */

            'email_notifications' => $this->email_notifications,

            'sms_notifications' => $this->sms_notifications,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
