<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicSettingController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
    }

    public function show(Request $request)
    {
        $resolved = $this->context->resolve($request->user());
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        }

        $settings = DB::table('academic_settings')->where('school_id', $schoolId)->first();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $resolved = $this->context->resolve($request->user());
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'No active school.'], 409);
        }

        $validated = $request->validate([
            'show_position_on_report' => 'required|boolean',
            'show_class_average_on_report' => 'required|boolean',
            'show_subject_position' => 'required|boolean',
            'default_report_card_layout' => 'required|string|in:standard,modern,compact',
            'pass_mark_percentage' => 'required|numeric|min:0|max:100',
        ]);

        DB::table('academic_settings')->updateOrInsert(
            ['school_id' => $schoolId],
            array_merge($validated, ['updated_at' => now()])
        );

        return response()->json([
            'success' => true,
            'message' => 'Academic Settings updated successfully.',
            'data' => DB::table('academic_settings')->where('school_id', $schoolId)->first(),
        ]);
    }
}
