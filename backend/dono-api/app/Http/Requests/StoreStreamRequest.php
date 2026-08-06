<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStreamRequest extends FormRequest
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
            'class_id' => [
                'required',
                Rule::exists('classes', 'id')->where(function ($query) use ($schoolId) {
                    $query->whereHas('division', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }),
            ],
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ];
    }
}

