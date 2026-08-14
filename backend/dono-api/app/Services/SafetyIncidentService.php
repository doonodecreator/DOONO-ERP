<?php

namespace App\Services;

use App\Models\SafetyIncident;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Visitor;
use Illuminate\Support\Facades\DB;

class SafetyIncidentService
{
    public function create(array $data): SafetyIncident
    {
        return DB::transaction(function () use ($data) {
            $schoolId = $data['school_id'];
            $prefix = 'SI-' . now()->format('Y') . '-';

            $lastIncident = SafetyIncident::where('school_id', $schoolId)
                ->where('incident_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->latest('id')
                ->first();

            $sequence = $lastIncident
                ? ((int) substr($lastIncident->incident_number, strlen($prefix))) + 1
                : 1;

            return SafetyIncident::create([
                ...$data,
                'incident_number' => $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                'subject_label' => $this->subjectLabel($data),
                'status' => 'Reported',
            ]);
        });
    }

    private function subjectLabel(array $data): string
    {
        return match ($data['subject_type']) {
            'Student' => Student::findOrFail($data['student_id'])->full_name,
            'Staff' => Staff::findOrFail($data['staff_id'])->full_name,
            'Visitor' => Visitor::findOrFail($data['visitor_id'])->visitor_name,
            'Other' => trim($data['other_subject_name']),
        };
    }
}
