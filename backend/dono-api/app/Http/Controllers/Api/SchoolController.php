<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\Country;
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
     * Get list of all countries for the school setup dropdown.
     */
    public function countries()
    {
        return response()->json(Country::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Add your school registration/store logic here
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
        // Add your update logic here
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
        // Add extend trial logic here
    }

    /**
     * Update subscription status for a school.
     */
    public function updateSubscriptionStatus(Request $request, School $school)
    {
        // Add subscription status update logic here
    }
}

