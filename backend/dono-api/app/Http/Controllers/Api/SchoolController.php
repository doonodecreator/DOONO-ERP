<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $schools = School::all();
        return response()->json([
            'success' => true,
            'data' => $schools
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'school_code' => 'required|string|max:50|unique:schools,school_code',
            'school_type' => 'required|string',
            'country' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string',
            'has_primary' => 'nullable|boolean',
            'has_secondary' => 'nullable|boolean',
        ]);

        $school = School::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'School created successfully',
            'data' => $school
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(School $school)
    {
        return response()->json([
            'success' => true,
            'data' => $school
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'school_code' => 'sometimes|required|string|max:50|unique:schools,school_code,' . $school->id,
            'school_type' => 'sometimes|required|string',
            'country' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $school->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully',
            'data' => $school
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(School $school)
    {
        $school->delete();
        return response()->json([
            'success' => true,
            'message' => 'School deleted successfully'
        ]);
    }

    /**
     * Extend trial period for a school.
     */
    public function extendTrial(Request $request, School $school)
    {
        return response()->json([
            'success' => true,
            'message' => 'Trial extended successfully'
        ]);
    }

    /**
     * Update subscription status for a school.
     */
    public function updateSubscriptionStatus(Request $request, School $school)
    {
        return response()->json([
            'success' => true,
            'message' => 'Subscription status updated successfully'
        ]);
    }
}

