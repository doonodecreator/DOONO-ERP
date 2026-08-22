<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSystemSettingRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'platform_name' => 'sometimes|required|string|max:255',
            'platform_email' => 'nullable|email|max:255',
            'platform_phone' => 'nullable|string|max:50',
            'platform_logo' => 'nullable|string|max:255',
            'trial_days' => 'sometimes|required|integer|min:0|max:3650',
            'default_subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'default_currency_id' => 'nullable|exists:currencies,id',
            'allow_school_registration' => 'sometimes|boolean',
            'maintenance_mode' => 'sometimes|boolean',
            'enforce_subscriptions' => 'sometimes|boolean',
            'paystack_enabled' => 'sometimes|boolean',
            'stripe_enabled' => 'sometimes|boolean',
            'email_notifications' => 'sometimes|boolean',
            'local_email_mode' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
        ];
    }
}
