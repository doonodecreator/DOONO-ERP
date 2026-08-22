<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'division_id' => $this->division_id,
            'class_id' => $this->class_id,
            'stream_id' => $this->stream_id,
            'academic_session_id' => $this->academic_session_id,
            'admission_number' => $this->admission_number,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'admission_date' => $this->admission_date,
            'photo' => $this->photo,
            'photo_url' => app(\App\Services\MediaStorageService::class)->url($this->photo),
            'religion' => $this->religion,
            'nationality' => $this->nationality,
            'state_of_origin' => $this->state_of_origin,
            'local_government' => $this->local_government,
            'address' => $this->address,
            'blood_group' => $this->blood_group,
            'genotype' => $this->genotype,
            'medical_notes' => $this->medical_notes,
            'status' => $this->status,
            'portal_account' => [
                'linked' => (bool) $this->user_id,
            ],
            'class' => $this->whenLoaded('class'),
            'stream' => $this->whenLoaded('stream'),
            'division' => $this->whenLoaded('division'),
            'school' => $this->whenLoaded('school'),
            'academic_session' => $this->whenLoaded('academicSession'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

