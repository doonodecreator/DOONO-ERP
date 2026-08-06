<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicVisit;
use Illuminate\Http\Request;

class ClinicVisitController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;

        return response()->json(
            ClinicVisit::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with(['student', 'nurse'])
            ->latest()
            ->paginate(15)
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

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $validated['treated_by'] = auth()->id();

        $visit = ClinicVisit::create($validated);

        return response()->json([
            'message' => 'Clinic visit logged successfully.',
            'data' => $visit->load(['student', 'nurse'])
        ], 201);
    }
}

