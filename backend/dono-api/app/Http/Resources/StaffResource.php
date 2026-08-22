<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'staff_number' => $this->staff_number,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'designation' => $this->designation,
            'department' => $this->department,
            'employment_date' => $this->employment_date?->format('Y-m-d'),
            'basic_salary' => $this->basic_salary,
            'qualification' => $this->qualification,
            'photo' => $this->photo,
            'photo_url' => app(\App\Services\MediaStorageService::class)->url($this->photo),
            'employment_status' => $this->employment_status ?? 'active',
            'school' => $this->whenLoaded('school'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

