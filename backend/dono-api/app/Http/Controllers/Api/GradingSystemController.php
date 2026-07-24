<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradingSystem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradingSystemController extends Controller
{
    /**
     * Display grading rules.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
        ]);

        $gradingSystems = GradingSystem::where(
                'school_id',
                $request->school_id
            )
            ->ordered()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $gradingSystems,
        ]);
    }

    /**
     * Store grading rule.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'minimum_score' => ['required', 'integer', 'min:0', 'max:100'],
            'maximum_score' => ['required', 'integer', 'min:0', 'max:100'],
            'grade' => ['required', 'string', 'max:10'],
            'remark' => ['required', 'string'],
            'grade_point' => ['nullable', 'numeric'],
            'display_order' => ['nullable', 'integer'],
        ]);

        $gradingSystem = GradingSystem::create($validated);
return response()->json([
            'success' => true,
            'message' => 'Grading system created successfully.',
            'data' => $gradingSystem,
        ], 201);
    }

    /**
     * Update grading rule.
     */
    public function update(Request $request, GradingSystem $gradingSystem): JsonResponse
    {
        $validated = $request->validate([
            'minimum_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'maximum_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'grade' => ['sometimes', 'string', 'max:10'],
            'remark' => ['sometimes', 'string'],
            'grade_point' => ['nullable', 'numeric'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $gradingSystem->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Grading system updated successfully.',
            'data' => $gradingSystem->fresh(),
        ]);
    }

    /**
     * Delete grading rule.
     */
    public function destroy(GradingSystem $gradingSystem): JsonResponse
    {
        $gradingSystem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grading system deleted successfully.',
        ]);
    }
}
