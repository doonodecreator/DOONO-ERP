<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportCardResource;
use App\Models\ReportCard;
use App\Services\Academic\ReportCardService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ReportCardController extends Controller
{
    public function __construct(
        protected ReportCardService $reportCardService,
        protected CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'Select an active school before viewing report cards.'], 409);
        }

        $query = ReportCard::with([
            'school',
            'studentEnrollment.student',
            'studentEnrollment.class',
            'academicSession',
            'term',
        ]);

        $query->where('school_id', $schoolId);

        return ReportCardResource::collection($query->latest()->paginate(15));
    }

    public function show(Request $request, ReportCard $reportCard)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId && (int) $reportCard->school_id === (int) $schoolId, 404);
        abort_unless($reportCard->studentEnrollment && (int) $reportCard->studentEnrollment->school_id === (int) $schoolId, 404);

        $generated = $this->reportCardService->generatePayload(
            $reportCard->studentEnrollment,
            $reportCard->academic_session_id,
            $reportCard->term_id
        );

        return response()->json([
            'success' => true,
            'report_card' => new ReportCardResource($reportCard),
            'generated' => $generated,
        ]);
    }

    public function downloadPdf(Request $request, ReportCard $reportCard)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId && (int) $reportCard->school_id === (int) $schoolId, 404);
        abort_unless($reportCard->studentEnrollment && (int) $reportCard->studentEnrollment->school_id === (int) $schoolId, 404);

        return $this->reportCardService->downloadPdf(
            $reportCard->studentEnrollment,
            $reportCard->academic_session_id,
            $reportCard->term_id
        );
    }
}
