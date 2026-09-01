<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'school_id' => $this->school_id,

            'school' => $this->whenLoaded('school'),

            'staff_number' => $this->staff_number,

            'first_name' => $this->first_name,

            'middle_name' => $this->middle_name,

            'last_name' => $this->last_name,

            'full_name' => trim($this->first_name . ' ' . ($this->middle_name ?? '') . ' ' . $this->last_name),

            'gender' => $this->gender,

            'date_of_birth' => $this->date_of_birth,

            'phone' => $this->phone,

            'email' => $this->email,

            'address' => $this->address,

            'designation' => $this->designation,

            'department' => $this->department,

            'employment_date' => $this->employment_date,

            'basic_salary' => $this->basic_salary,

            'qualification' => $this->qualification,

            'photo' => $this->photo,

            'employment_status' => $this->employment_status,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
