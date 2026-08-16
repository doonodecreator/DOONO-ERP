<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSystemSettingRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Platform
            |--------------------------------------------------------------------------
            */

            'platform_name' => 'sometimes|required|string|max:255',

            'platform_email' => 'nullable|email|max:255',

            'platform_phone' => 'nullable|string|max:50',

            'platform_logo' => 'nullable|string|max:255',

            /*
            |--------------------------------------------------------------------------
            | Trial
            |--------------------------------------------------------------------------
            */

            'trial_days' => 'sometimes|required|integer|min:0|max:3650',

            'default_subscription_plan_id' => 'nullable|exists:subscription_plans,id',

            /*
            |--------------------------------------------------------------------------
            | Currency
            |--------------------------------------------------------------------------
            */

            'default_currency_id' => 'nullable|exists:currencies,id',

            /*
            |--------------------------------------------------------------------------
            | Registration
            |--------------------------------------------------------------------------
            */

            'allow_school_registration' => 'sometimes|boolean',

            /*
            |--------------------------------------------------------------------------
            | Maintenance
            |--------------------------------------------------------------------------
            */

            'maintenance_mode' => 'sometimes|boolean',

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            'paystack_enabled' => 'sometimes|boolean',

            'stripe_enabled' => 'sometimes|boolean',
            'enforce_subscriptions' => 'sometimes|boolean',
            'enforce_subscriptions' => 'sometimes|boolean',

            /*
            |--------------------------------------------------------------------------
            | Notifications
            |--------------------------------------------------------------------------
            */

            'email_notifications' => 'sometimes|boolean',

            'sms_notifications' => 'sometimes|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'trial_days.required' => 'Trial duration is required.',

            'trial_days.integer' => 'Trial duration must be a whole number.',

            'default_subscription_plan_id.exists' => 'Selected subscription plan does not exist.',

            'default_currency_id.exists' => 'Selected currency does not exist.',
        ];
    }
}
