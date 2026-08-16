<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ClinicVisitController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            ClinicVisit::whereHas('student', function ($query) use ($schoolId) {
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
            'student_id' => 'required|exists:students,id',
            'visit_date' => 'required|date',
            'complaint' => 'required|string',
            'treatment_given' => 'required|string',
            'nurse_notes' => 'nullable|string',
        ]);

        $visit = ClinicVisit::create($validated);

        return response()->json([
            'message' => 'Clinic visit logged successfully.',
            'data' => $visit->load(['student'])
        ], 201);
    }

    public function show(ClinicVisit $clinicVisit)
    {
        return response()->json($clinicVisit->load(['student']));
    }

    public function destroy(ClinicVisit $clinicVisit)
    {
        $clinicVisit->delete();

        return response()->json([
            'message' => 'Clinic visit record deleted.'
        ]);
    }
}
