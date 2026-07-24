<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
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

            'school_id' => 'required|exists:schools,id',

            'subscription_plan_id' => 'required|exists:subscription_plans,id',

            'start_date' => 'required|date',

            'expiry_date' => 'required|date|after_or_equal:start_date',

            'trial_ends_at' => 'nullable|date|after_or_equal:start_date',

            'next_billing_date' => 'nullable|date|after_or_equal:start_date',

            'billing_cycle' => 'required|in:monthly,quarterly,half_yearly,yearly',

            'status' => 'required|in:trial,active,expired,cancelled',

            'amount_paid' => 'required|numeric|min:0',

            'currency' => 'required|string|max:10',

            'payment_reference' => 'nullable|string|max:255',

            'auto_renew' => 'required|boolean',

            'is_current' => 'required|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'school_id.required' => 'School is required.',

            'school_id.exists' => 'Selected school does not exist.',

            'subscription_plan_id.required' => 'Subscription plan is required.',

            'subscription_plan_id.exists' => 'Selected subscription plan does not exist.',
        ];
    }
}
