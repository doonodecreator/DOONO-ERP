<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolSubscriptionRequest extends FormRequest
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

            'school_id' => 'sometimes|exists:schools,id',

            'subscription_plan_id' => 'sometimes|exists:subscription_plans,id',

            'start_date' => 'sometimes|date',

            'expiry_date' => 'sometimes|date',

            'trial_ends_at' => 'nullable|date',

            'next_billing_date' => 'nullable|date',

            'billing_cycle' => 'sometimes|in:monthly,quarterly,half_yearly,yearly',

            'status' => 'sometimes|in:trial,active,expired,cancelled',

            'amount_paid' => 'sometimes|numeric|min:0',

            'currency' => 'sometimes|string|max:10',

            'payment_reference' => 'nullable|string|max:255',

            'auto_renew' => 'sometimes|boolean',

            'is_current' => 'sometimes|boolean',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'school_id.exists' => 'Selected school does not exist.',

            'subscription_plan_id.exists' => 'Selected subscription plan does not exist.',
        ];
    }
}
