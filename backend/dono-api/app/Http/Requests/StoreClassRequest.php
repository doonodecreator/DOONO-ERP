<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = auth()->user();
        $schoolId = method_exists($user, 'currentSchoolId') ? $user->currentSchoolId() : $user->school_id;

        return [
            'division_id' => [
                'required',
                Rule::exists('divisions', 'id')->where(function ($query) use ($schoolId) {
                    $query->where('school_id', $schoolId);
                }),
            ],
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ];
    }
}

