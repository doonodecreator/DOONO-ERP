<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromoCampaignRequest extends FormRequest
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

            'slug' => 'required|string|max:150|unique:promo_campaigns,slug',

            'description' => 'nullable|string',

            'discount_type' => [
                'required',
                Rule::in([
                    'percentage',
                    'fixed'
                ]),
            ],

            'discount_value' => 'required|numeric|min:0',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after:start_date',

            'maximum_usage' => 'nullable|integer|min:1',

            'times_used' => 'nullable|integer|min:0',

            'is_active' => 'required|boolean',

            'auto_activate' => 'required|boolean',

            /*
            |--------------------------------------------------------------------------
            | Subscription Plans
            |--------------------------------------------------------------------------
            */

            'subscription_plans' => 'nullable|array',

            'subscription_plans.*' => 'exists:subscription_plans,id',
        ];
    }

    public function messages(): array
    {
        return [

            'name.required' => 'Campaign name is required.',

            'slug.unique' => 'Campaign slug already exists.',

            'discount_type.required' => 'Select a discount type.',

            'discount_value.required' => 'Enter the discount value.',

            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
