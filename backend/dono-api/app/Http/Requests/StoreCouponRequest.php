<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
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

            'name' => 'required|string|max:150',

            'code' => 'required|string|max:50|unique:coupons,code',

            'description' => 'nullable|string',

            'discount_type' => 'required|in:percentage,fixed',

            'discount_value' => 'required|numeric|min:0',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after_or_equal:start_date',

            'maximum_usage' => 'nullable|integer|min:1',

            'maximum_usage_per_school' => 'nullable|integer|min:1',

            'first_time_only' => 'required|boolean',

            'is_active' => 'required|boolean',

            /*
            |--------------------------------------------------------------------------
            | Optional Relationships
            |--------------------------------------------------------------------------
            */

            'subscription_plans' => 'nullable|array',

            'subscription_plans.*' => 'exists:subscription_plans,id',

            'schools' => 'nullable|array',

            'schools.*' => 'exists:schools,id',
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'code.unique' => 'Coupon code already exists.',

            'subscription_plans.*.exists' => 'Invalid subscription plan selected.',

            'schools.*.exists' => 'Invalid school selected.',
        ];
    }
}
