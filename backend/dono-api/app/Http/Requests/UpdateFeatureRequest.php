<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() === true;
    }

    public function rules(): array
    {
        $featureId = $this->route('feature')?->id ?? $this->route('feature');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'slug' => ['sometimes', 'required', 'string', 'max:120', 'alpha_dash', Rule::unique('features', 'slug')->ignore($featureId)],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
