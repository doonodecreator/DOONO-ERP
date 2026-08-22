<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionPlanRequest extends FormRequest
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

            'name' => 'required|string|max:100',

            'slug' => 'required|string|max:100|unique:subscription_plans,slug',

            'description' => 'nullable|string',

            'monthly_price' => 'required|numeric|min:0',

            'quarterly_price' => 'required|numeric|min:0',

            'half_yearly_price' => 'required|numeric|min:0',

            'yearly_price' => 'required|numeric|min:0',

            'currency' => 'required|string|max:10',

            'max_students' => 'nullable|integer|min:-1',

            'max_staff' => 'nullable|integer|min:-1',

            'max_branches' => 'required|integer|min:-1',

            'features' => 'nullable|array',
            'feature_ids' => 'sometimes|array',
            'feature_ids.*' => 'integer|exists:features,id',

            'trial_days' => 'required|integer|min:0',

            'is_active' => 'required|boolean',
        ];
    }
}
