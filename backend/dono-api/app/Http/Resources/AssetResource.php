<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'asset_number' => $this->asset_number,
            'name' => $this->name,
            'category' => $this->category,
            'quantity' => $this->quantity,
            'unit_of_measure' => $this->unit_of_measure,
            'location' => $this->location,
            'custodian_staff_id' => $this->custodian_staff_id,
            'acquisition_date' => $this->acquisition_date?->format('Y-m-d'),
            'acquisition_cost' => $this->acquisition_cost,
            'warranty_expires_at' => $this->warranty_expires_at?->format('Y-m-d'),
            'condition' => $this->condition,
            'status' => $this->status,
            'notes' => $this->notes,
            'registered_by' => $this->registered_by,
            'school' => $this->whenLoaded('school', function () {
                return [
                    'id' => $this->school?->id,
                    'name' => $this->school?->name,
                ];
            }),
            'custodian' => $this->whenLoaded('custodian', function () {
                return [
                    'id' => $this->custodian?->id,
                    'full_name' => $this->custodian?->full_name,
                    'staff_number' => $this->custodian?->staff_number,
                ];
            }),
            'registrar' => $this->whenLoaded('registrar', function () {
                return [
                    'id' => $this->registrar?->id,
                    'name' => $this->registrar?->name,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
