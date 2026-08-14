<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Services\CurrentContextService;
use Illuminate\Validation\Rule;

class StoreStreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();
        $schoolId = $this->attributes->get('current_school_id')
            ?? ($user ? app(CurrentContextService::class)->currentSchool($user)?->id : null);

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

