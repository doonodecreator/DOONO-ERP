<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentGatePass;
use Illuminate\Http\Request;

class StudentGatePassController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        return response()->json(
            StudentGatePass::where('school_id', $schoolId)
                ->with(['student'])
                ->latest()
                ->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:Early Departure,Late Arrival',
            'authorized_by' => 'required|string|max:255',
            'reason' => 'required|string',
        ]);

        abort_unless(
            Student::whereKey($validated['student_id'])->where('school_id', $schoolId)->exists(),
            422,
            'The selected student does not belong to the active school.'
        );

        $pass = StudentGatePass::create($validated + [
            'school_id' => $schoolId,
            'pass_date' => now(),
        ]);

        return response()->json([
            'message' => 'Gate pass issued successfully.',
            'data' => $pass->load('student'),
        ], 201);
    }
}
