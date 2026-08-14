<?php

namespace App\Http\Requests;

use App\Services\CurrentContextService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = $this->currentSchoolId();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => [
                'sometimes',
                'required',
                Rule::in([
                    'IT Equipment',
                    'Furniture',
                    'Classroom Equipment',
                    'Laboratory',
                    'Sports',
                    'Security',
                    'Office',
                    'Other',
                ]),
            ],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000000'],
            'unit_of_measure' => ['sometimes', 'nullable', 'string', 'max:50'],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'custodian_staff_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where('school_id', $schoolId),
            ],
            'acquisition_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'acquisition_cost' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'warranty_expires_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:acquisition_date'],
            'condition' => ['sometimes', 'required', Rule::in(['New', 'Good', 'Fair', 'Poor'])],
            'status' => ['sometimes', 'required', Rule::in(['Active', 'In Repair', 'Lost', 'Disposed'])],
            'notes' => ['sometimes', 'nullable', 'string', 'max:4000'],
        ];
    }

    private function currentSchoolId(): ?int
    {
        $schoolId = $this->attributes->get('current_school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        $user = $this->user();

        return $user
            ? app(CurrentContextService::class)->currentSchool($user)?->id
            : null;
    }
}
