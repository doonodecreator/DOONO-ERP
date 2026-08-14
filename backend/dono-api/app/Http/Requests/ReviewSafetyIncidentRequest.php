<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewSafetyIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['Under Review', 'Resolved', 'Closed'])],
            'immediate_action' => ['nullable', 'string', 'max:4000', 'required_if:status,Resolved'],
            'guardian_contacted' => ['sometimes', 'boolean'],
            'emergency_services_contacted' => ['sometimes', 'boolean'],
            'resolution_notes' => ['nullable', 'string', 'max:4000', 'required_if:status,Resolved'],
        ];
    }
}
