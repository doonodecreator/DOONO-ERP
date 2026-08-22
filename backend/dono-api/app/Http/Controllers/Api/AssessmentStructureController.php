<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentStructureRequest;
use App\Http\Requests\UpdateAssessmentStructureRequest;
use App\Http\Resources\AssessmentStructureResource;
use App\Models\AssessmentStructure;
use App\Models\CbtAssessment;
use App\Models\ResultComponent;
use Illuminate\Http\Request;

class AssessmentStructureController extends Controller
{
    /**
     * Display a listing.
     */
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return AssessmentStructureResource::collection(
            AssessmentStructure::where('school_id', $schoolId)
                ->with('school')
                ->orderBy('display_order')
                ->paginate(100)
        );
    }

    /**
     * Store.
     */
    public function store(StoreAssessmentStructureRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->requireSchool($request);
        $activeWeight = (float) AssessmentStructure::where('school_id', $data['school_id'])->where('is_active', true)->sum('percentage');
        if (($data['is_active'] ?? false) && $activeWeight + (float) $data['percentage'] > 100) {
            abort(422, 'Active assessment weights for a school cannot exceed 100%.');
        }
        $structure = AssessmentStructure::create($data);

        return (new AssessmentStructureResource(
            $structure->load('school')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Show.
     */
    public function show(Request $request, AssessmentStructure $assessmentStructure)
    {
        abort_unless((int) $assessmentStructure->school_id === $this->requireSchool($request), 404);
        return new AssessmentStructureResource($assessmentStructure->load('school'));
    }

    /**
     * Update.
     */
    public function update(
        UpdateAssessmentStructureRequest $request,
        AssessmentStructure $assessmentStructure
    ) {
        abort_unless((int) $assessmentStructure->school_id === $this->requireSchool($request), 404);
        $data = $request->validated();
        unset($data['school_id']);
        if ($assessmentStructure->is_active && array_key_exists('is_active', $data) && !$data['is_active']) {
            abort_unless(!ResultComponent::where('assessment_structure_id', $assessmentStructure->id)->exists() && !CbtAssessment::where('assessment_structure_id', $assessmentStructure->id)->exists(), 409, 'This assessment structure is already used by results or CBT assessments and cannot be deactivated.');
        }
        if (($data['is_active'] ?? $assessmentStructure->is_active)) {
            $activeWeight = (float) AssessmentStructure::where('school_id', $assessmentStructure->school_id)
                ->where('is_active', true)
                ->where('id', '!=', $assessmentStructure->id)
                ->sum('percentage');
            if ($activeWeight + (float) ($data['percentage'] ?? $assessmentStructure->percentage) > 100) {
                abort(422, 'Active assessment weights for a school cannot exceed 100%.');
            }
        }
        $assessmentStructure->update($data);

        return new AssessmentStructureResource(
            $assessmentStructure->load('school')
        );
    }

    /**
     * Delete.
     */
    public function destroy(Request $request, AssessmentStructure $assessmentStructure)
    {
        abort_unless((int) $assessmentStructure->school_id === $this->requireSchool($request), 404);
        abort_unless(!ResultComponent::where('assessment_structure_id', $assessmentStructure->id)->exists() && !CbtAssessment::where('assessment_structure_id', $assessmentStructure->id)->exists(), 409, 'This assessment structure is already used by results or CBT assessments and cannot be deleted. Deactivate it only after all dependent records are archived.');
        $assessmentStructure->delete();

        return response()->json([
            'message' =>
                'Assessment structure deleted successfully.'
        ]);
    }
}
