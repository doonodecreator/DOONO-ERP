<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicSessionRequest;
use App\Http\Requests\UpdateAcademicSessionRequest;
use App\Http\Resources\AcademicSessionResource;
use App\Models\AcademicSession;

class AcademicSessionController extends Controller
{
    /**
     * Display a listing of academic sessions.
     */
    public function index()
    {
        return AcademicSessionResource::collection(
            AcademicSession::with('school')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created academic session.
     */
    public function store(StoreAcademicSessionRequest $request)
    {
        $academicSession = AcademicSession::create($request->validated());

        return (new AcademicSessionResource(
            $academicSession->load('school')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified academic session.
     */
    public function show(AcademicSession $academicSession)
    {
        return new AcademicSessionResource(
            $academicSession->load('school')
        );
    }

    /**
     * Update the specified academic session.
     */
    public function update(UpdateAcademicSessionRequest $request, AcademicSession $academicSession)
    {
        $academicSession->update($request->validated());

        return new AcademicSessionResource(
            $academicSession->load('school')
        );
    }

    /**
     * Remove the specified academic session.
     */
    public function destroy(AcademicSession $academicSession)
    {
        $academicSession->delete();

        return response()->json([
            'message' => 'Academic session deleted successfully.'
        ]);
    }
}
