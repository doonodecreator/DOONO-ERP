<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportCardRequest;
use App\Http\Requests\UpdateReportCardRequest;
use App\Http\Resources\ReportCardResource;
use App\Models\ReportCard;

class ReportCardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ReportCardResource::collection(
            ReportCard::with([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreReportCardRequest $request)
    {
        $reportCard = ReportCard::create($request->validated());

        return (new ReportCardResource(
            $reportCard->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ReportCard $reportCard)
    {
        return new ReportCardResource(
            $reportCard->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateReportCardRequest $request, ReportCard $reportCard)
    {
        $reportCard->update($request->validated());

        return new ReportCardResource(
            $reportCard->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(ReportCard $reportCard)
    {
        $reportCard->delete();

        return response()->json([
            'message' => 'Report card deleted successfully.',
        ]);
    }
}
