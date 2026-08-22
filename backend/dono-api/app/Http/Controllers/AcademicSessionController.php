<?php

namespace App\Http\Controllers;

use App\Models\AcademicSession;
use Illuminate\Http\Request;
class AcademicSessionController extends Controller
{
    public function index(Request $request)
    {
        // Only fetch sessions for the currently authenticated user's school
        $schoolId = $this->requireSchool($request);
        $sessions = AcademicSession::where('school_id', $schoolId)
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json(['data' => $sessions]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'boolean',
        ]);

        // Automatically assign the school_id based on the logged-in user
        $session = AcademicSession::create([
            'school_id' => $this->requireSchool($request),
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_current' => $request->is_current ?? false,
            'status' => 'active',
        ]);

        // If this is set as current, you might want to set all other sessions to false
        if ($session->is_current) {
            AcademicSession::where('school_id', $session->school_id)
                ->where('id', '!=', $session->id)
                ->update(['is_current' => false]);
        }

        return response()->json([
            'message' => 'Academic Session created successfully.',
            'data' => $session
        ], 201);
    }
}

