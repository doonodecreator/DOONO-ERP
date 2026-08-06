<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportCardResource;
use App\Models\ReportCard;
use App\Services\Academic\ReportCardService;
use Illuminate\Http\Request;

class ReportCardController extends Controller
{
    public function __construct(
        protected ReportCardService $reportCardService
    ) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

        $query = ReportCard::with([
            'school',
            'studentEnrollment.student',
            'studentEnrollment.class',
            'academicSession',
            'term',
        ]);

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        return ReportCardResource::collection($query->latest()->paginate(15));
    }

    public function show(Request $request, ReportCard $reportCard)
    {
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

    /**
     * Download or stream PDF Report Card.
     */
    public function downloadPdf(ReportCard $reportCard)
    {
        return $this->reportCardService->downloadPdf(
            $reportCard->studentEnrollment,
            $reportCard->academic_session_id,
            $reportCard->term_id
        );
    }
}
