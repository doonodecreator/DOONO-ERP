<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromoCampaignRequest extends FormRequest
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

            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                Rule::unique('promo_campaigns', 'slug')
                    ->ignore($this->promo_campaign),
            ],

            'description' => 'nullable|string',

            'discount_type' => [
                'sometimes',
                'required',
                Rule::in([
                    'percentage',
                    'fixed',
                ]),
            ],

            'discount_value' => 'sometimes|required|numeric|min:0',

            'start_date' => 'sometimes|required|date',

            'end_date' => 'sometimes|required|date|after:start_date',

            'maximum_usage' => 'nullable|integer|min:1',

            'times_used' => 'nullable|integer|min:0',

            'is_active' => 'sometimes|required|boolean',

            'auto_activate' => 'sometimes|required|boolean',

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

            'slug.unique' => 'Campaign slug already exists.',

            'end_date.after' => 'End date must be after the start date.',
        ];
    }
}
