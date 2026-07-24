<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportCardRequest;
use App\Http\Requests\UpdateReportCardRequest;
use App\Http\Resources\ReportCardResource;
use App\Models\ReportCard;
use App\Services\Academic\ReportCardService;

class ReportCardController extends Controller
{
    public function __construct(
        protected ReportCardService $reportCardService
    ) {
    }

    /**
     * Display a listing of report cards.
     */
    public function index()
    {
        return ReportCardResource::collection(
            ReportCard::with([
                'school',
                'studentEnrollment.student',
                'studentEnrollment.class',
                'studentEnrollment.stream',
                'academicSession',
                'term',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    /**
     * Store a newly created report card.
     */
    public function store(StoreReportCardRequest $request)
    {
        $reportCard = ReportCard::create(
            $request->validated()
        );

        return (new ReportCardResource(
            $reportCard->load([
                'school',
                'studentEnrollment.student',
                'studentEnrollment.class',
                'studentEnrollment.stream',
                'academicSession',
                'term',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display one report card together with all generated data.
     */
    public function show(
        ReportCard $reportCard
    ) {

        $reportCard->load([
            'school',
            'studentEnrollment.student',
            'studentEnrollment.class',
            'studentEnrollment.stream',
            'academicSession',
            'term',
        ]);

        $generated =
            $this->reportCardService->generate(
                $reportCard->studentEnrollment,
                $reportCard->academic_session_id,
                $reportCard->term_id
            );
           return response()->json([

            'success' => true,

            'report_card' => new ReportCardResource(
                $reportCard
            ),

            'generated' => $generated,

        ]);
    }

    /**
     * Update the specified report card.
     */
    public function update(
        UpdateReportCardRequest $request,
        ReportCard $reportCard
    ) {

        $reportCard->update(
            $request->validated()
        );

        return new ReportCardResource(

            $reportCard->load([

                'school',

                'studentEnrollment.student',

                'studentEnrollment.class',

                'studentEnrollment.stream',

                'academicSession',

                'term',

            ])

        );
    }

    /**
     * Delete a report card.
     */
    public function destroy(
        ReportCard $reportCard
    ) {

        $reportCard->delete();

        return response()->json([

            'success' => true,

            'message' =>
                'Report card deleted successfully.',

        ]);
    }
}
