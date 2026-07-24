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

            /*
            |--------------------------------------------------------------------------
            | Country Information
            |--------------------------------------------------------------------------
            */

            'country_id' => $this->country_id,

            'country' => $this->whenLoaded('country', function () {

                return [

                    'id' => $this->country->id,

                    'name' => $this->country->name,

                    'iso2' => $this->country->iso2,

                    'iso3' => $this->country->iso3,

                    'phone_code' => $this->country->phone_code,

                    'timezone' => $this->country->timezone,

                    'locale' => $this->country->locale,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Currency
            |--------------------------------------------------------------------------
            */

            'currency' => $this->whenLoaded('country', function () {

                return [

                    'code' => $this->country->currency->code,

                    'name' => $this->country->currency->name,

                    'symbol' => $this->country->currency->symbol,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Subscription
            |--------------------------------------------------------------------------
            */

            'subscription' => $this->whenLoaded('subscription', function () {

                return [

                    'plan' => optional(
                        $this->subscription->subscriptionPlan
                    )->name,

                    'status' => $this->subscription->status,

                    'trial' => $this->subscription->isTrial(),

                    'days_remaining' => $this->subscription->daysRemaining(),

                    'expires_at' => $this->subscription->expiry_date,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | School
            |--------------------------------------------------------------------------
            */

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
