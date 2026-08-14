<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewDisciplineCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['Under Review', 'Resolved', 'Dismissed']),
            ],
            'action_taken' => ['nullable', 'string', 'max:2000', 'required_if:status,Resolved'],
            'parent_notified' => ['sometimes', 'boolean'],
            'resolution_notes' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
