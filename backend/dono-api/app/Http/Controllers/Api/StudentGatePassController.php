<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentGatePass;
use Illuminate\Http\Request;

class StudentGatePassController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = auth()->user()->school_id ?? null;
        return response()->json(
            StudentGatePass::when($schoolId, fn($q) => $q->where('school_id', $schoolId))
                ->with(['student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:Early Departure,Late Arrival',
            'authorized_by' => 'required|string|max:255',
            'reason' => 'required|string',
        ]);

        if (auth()->check() && auth()->user()->school_id) {
            $validated['school_id'] = auth()->user()->school_id;
        }

        $validated['pass_date'] = now();

        $pass = StudentGatePass::create($validated);
        return response()->json(['message' => 'Gate pass issued successfully.', 'data' => $pass->load('student')], 201);
    }
}

