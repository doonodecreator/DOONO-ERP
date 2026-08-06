<?php

namespace App\Http\Controllers;

use App\Models\Term;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TermController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $request->user()->school_id;

        // Fetch terms belonging ONLY to the user's school's academic sessions
        $terms = Term::whereHas('academicSession', function ($query) use ($schoolId) {
            $query->where('school_id', $schoolId);
        })
        ->with('academicSession') // Eager load for term.academic_session.name in React
        ->orderBy('start_date', 'desc')
        ->get();

        return response()->json(['data' => $terms]);
    }

    public function store(Request $request)
    {
        $schoolId = $request->user()->school_id;

        $request->validate([
            'academic_session_id' => [
                'required',
                Rule::exists('academic_sessions', 'id')->where(function ($query) use ($schoolId) {
                    $query->where('school_id', $schoolId);
                }),
            ],
            'name' => ['required', Rule::in(['First Term', 'Second Term', 'Third Term'])],
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'boolean',
            'status' => ['required', Rule::in(['active', 'closed'])],
        ]);

        $term = Term::create([
            'academic_session_id' => $request->academic_session_id,
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_current' => $request->is_current ?? false,
            'status' => $request->status ?? 'active',
        ]);

        // If this term is set as current, turn off 'is_current' for all other terms in this school
        if ($term->is_current) {
            Term::whereHas('academicSession', function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->where('id', '!=', $term->id)
            ->update(['is_current' => false]);
        }

        return response()->json([
            'message' => 'Term created successfully.',
            'data' => $term->load('academicSession')
        ], 201);
    }
}

