<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentStructureRequest;
use App\Http\Requests\UpdateAssessmentStructureRequest;
use App\Http\Resources\AssessmentStructureResource;
use App\Models\AssessmentStructure;

class AssessmentStructureController extends Controller
{
    /**
     * Display a listing.
     */
    public function index()
    {
        return AssessmentStructureResource::collection(
            AssessmentStructure::with('school')
                ->orderBy('display_order')
                ->paginate(20)
        );
    }

    /**
     * Store.
     */
    public function store(StoreAssessmentStructureRequest $request)
    {
        $structure = AssessmentStructure::create(
            $request->validated()
        );

        return (new AssessmentStructureResource(
            $structure->load('school')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Show.
     */
    public function show(
        AssessmentStructure $assessmentStructure
    ) {
        return new AssessmentStructureResource(
            $assessmentStructure->load('school')
        );
    }

    /**
     * Update.
     */
    public function update(
        UpdateAssessmentStructureRequest $request,
        AssessmentStructure $assessmentStructure
    ) {
        $assessmentStructure->update(
            $request->validated()
        );

        return new AssessmentStructureResource(
            $assessmentStructure->load('school')
        );
    }

    /**
     * Delete.
     */
    public function destroy(
        AssessmentStructure $assessmentStructure
    ) {
        $assessmentStructure->delete();

        return response()->json([
            'message' =>
                'Assessment structure deleted successfully.'
        ]);
    }
}
