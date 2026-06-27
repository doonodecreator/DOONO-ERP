<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Http\Resources\SchoolResource;
use App\Models\School;

class SchoolController extends Controller
{
    /**
     * Display a listing of schools.
     */
    public function index()
    {
        return SchoolResource::collection(
            School::with('organization')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created school.
     */
    public function store(StoreSchoolRequest $request)
    {
        $school = School::create($request->validated());

        return (new SchoolResource(
            $school->load('organization')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified school.
     */
    public function show(School $school)
    {
        return new SchoolResource(
            $school->load('organization')
        );
    }

    /**
     * Update the specified school.
     */
    public function update(UpdateSchoolRequest $request, School $school)
    {
        $school->update($request->validated());

        return new SchoolResource(
            $school->load('organization')
        );
    }

    /**
     * Remove the specified school.
     */
    public function destroy(School $school)
    {
        $school->delete();

        return response()->json([
            'message' => 'School deleted successfully.'
        ]);
    }
}
