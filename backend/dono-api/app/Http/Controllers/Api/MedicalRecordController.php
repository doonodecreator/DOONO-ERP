<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            MedicalRecord::whereHas('student', function ($query) use ($schoolId) {
                if ($schoolId) {
                    $query->where('school_id', $schoolId);
                }
            })
            ->with(['student'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id|unique:medical_records,student_id',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronic_conditions' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
        ]);

        $record = MedicalRecord::create($validated);

        return response()->json([
            'message' => 'Medical record saved successfully.',
            'data' => $record->load(['student'])
        ], 201);
    }

    public function show(MedicalRecord $medicalRecord)
    {
        return response()->json($medicalRecord->load(['student']));
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        $validated = $request->validate([
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'chronic_conditions' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
        ]);

        $medicalRecord->update($validated);

        return response()->json([
            'message' => 'Medical record updated successfully.',
            'data' => $medicalRecord->load(['student'])
        ]);
    }

    public function destroy(MedicalRecord $medicalRecord)
    {
        $medicalRecord->delete();

        return response()->json([
            'message' => 'Medical record deleted.'
        ]);
    }
}
