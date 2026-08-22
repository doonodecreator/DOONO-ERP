<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $stream = $this->route('stream');
        $schoolId = $this->attributes->get('current_school_id')
            ?? app(CurrentContextService::class)->currentSchool($this->user())?->id;
        $classId = $this->input('class_id', $stream?->class_id);

        return [
            'class_id' => [
                'sometimes',
                'required',
                Rule::exists('classes', 'id')->where(function ($query) use ($schoolId) {
                    $query->whereIn('division_id', function ($divisionQuery) use ($schoolId) {
                        $divisionQuery->select('id')
                            ->from('divisions')
                            ->where('school_id', $schoolId);
                    });
                }),
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('streams', 'name')
                    ->ignore($stream?->id)
                    ->where('class_id', $classId),
            ],
            'code' => ['nullable', 'string', 'max:20'],
            'display_order' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'class_id.exists' => 'Selected class does not exist in the active school.',
            'name.unique' => 'This stream already exists for the selected class.',
            'display_order.integer' => 'Display order must be a valid number.',
        ];
    }
}
