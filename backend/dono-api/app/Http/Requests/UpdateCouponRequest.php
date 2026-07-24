<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCouponRequest extends FormRequest
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

            'name' => 'sometimes|required|string|max:150',

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('coupons', 'code')
                    ->ignore($this->coupon),
            ],

            'description' => 'nullable|string',

            'discount_type' => 'sometimes|in:percentage,fixed',

            'discount_value' => 'sometimes|numeric|min:0',

            'start_date' => 'sometimes|date',

            'end_date' => 'sometimes|date',

            'maximum_usage' => 'nullable|integer|min:1',

            'maximum_usage_per_school' => 'nullable|integer|min:1',

            'first_time_only' => 'sometimes|boolean',

            'is_active' => 'sometimes|boolean',

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
