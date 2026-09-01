<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Services\CurrentContextService;
use Illuminate\Validation\Rule;

class StoreCommunicationRequest extends FormRequest
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
            'type' => ['sometimes', Rule::in(['notice', 'message'])],
            'audience' => ['required', Rule::in(['all', 'staff', 'parents', 'students', 'individual'])],
            'recipient_id' => ['nullable', 'integer', 'exists:users,id', Rule::requiredIf(fn () => $this->input('audience') === 'individual')],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:10000'],
            'is_published' => ['sometimes', 'boolean'],
            'delivery_channel' => ['sometimes', Rule::in(['in_app', 'sms', 'push'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->input('audience') !== 'individual' && $this->filled('recipient_id')) {
                $validator->errors()->add('recipient_id', 'A recipient can be selected only for an individual communication.');
            }
        });
    }
}
