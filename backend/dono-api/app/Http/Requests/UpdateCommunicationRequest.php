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
            'type' => ['sometimes', Rule::in(['notice', 'message'])],
            'audience' => ['sometimes', Rule::in(['all', 'staff', 'parents', 'students', 'individual'])],
            'recipient_id' => ['nullable', 'integer', 'exists:users,id'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['sometimes', 'required', 'string', 'max:10000'],
            'is_published' => ['sometimes', 'boolean'],
            'delivery_channel' => ['sometimes', Rule::in(['in_app', 'sms', 'push'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $communication = $this->route('communication');
            $audience = $this->input('audience', $communication?->audience);
            $recipientId = $this->input('recipient_id', $communication?->recipient_id);

            if ($audience === 'individual' && blank($recipientId)) {
                $validator->errors()->add('recipient_id', 'An individual communication must have a recipient.');
            }

            if ($audience !== 'individual' && filled($this->input('recipient_id'))) {
                $validator->errors()->add('recipient_id', 'A recipient can be selected only for an individual communication.');
            }
        });
    }
}
