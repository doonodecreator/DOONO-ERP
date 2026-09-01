<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'school_id' => 'required|exists:schools,id',

            'name' => 'required|string|max:255',

            'code' => 'required|string|max:255|unique:fee_categories,code',

            'description' => 'nullable|string',

            'default_amount' => 'required|numeric|min:0',

            'frequency' => 'required|in:One Time,Termly,Sessional,Monthly',

            'is_mandatory' => 'sometimes|boolean',

            'is_active' => 'sometimes|boolean',

        ];
    }

    public function messages(): array
    {
        return [
            'school_id.exists' => 'Selected school does not exist.',
            'code.unique' => 'This fee category code already exists.',
        ];
    }
}
