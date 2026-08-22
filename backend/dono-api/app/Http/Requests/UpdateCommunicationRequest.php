<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommunicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->user()?->isSuperAdmin()) {
            return true;
        }

        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;

        return $schoolId !== null && $this->user()?->hasPermission('send_communication', (int) $schoolId) === true;
    }

    public function rules(): array
    {
        return [
            'audience' => ['sometimes', Rule::in(['all', 'staff', 'parents', 'students', 'individual'])],
            'recipient_id' => ['nullable', 'integer', 'exists:users,id'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['sometimes', 'required', 'string', 'max:10000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
