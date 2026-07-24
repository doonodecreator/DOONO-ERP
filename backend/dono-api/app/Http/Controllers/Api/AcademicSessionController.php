<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicSessionRequest;
use App\Http\Requests\UpdateAcademicSessionRequest;
use App\Http\Resources\AcademicSessionResource;
use App\Models\AcademicSession;

class AcademicSessionController extends Controller
{
    public function index()
    {
        return AcademicSessionResource::collection(
            AcademicSession::latest()->paginate(10)
        );
    }

    public function store(StoreAcademicSessionRequest $request)
    {
        if ($request->is_active) {
            AcademicSession::query()->update([
                'is_current' => false,
            ]);
        }

        $academicSession = AcademicSession::create([
            'school_id' => 1,
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_current' => $request->is_active,
            'status' => $request->is_active ? 'active' : 'closed',
        ]);

        return (new AcademicSessionResource($academicSession))
            ->response()
            ->setStatusCode(201);
    }

    public function show(AcademicSession $academicSession)
    {
        return new AcademicSessionResource($academicSession);
    }

    public function update(UpdateAcademicSessionRequest $request, AcademicSession $academicSession)
    {
        if ($request->is_active) {
            AcademicSession::query()->update([
                'is_current' => false,
            ]);
        }

        $academicSession->update([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_current' => $request->is_active,
            'status' => $request->is_active ? 'active' : 'closed',
        ]);

        return new AcademicSessionResource($academicSession);
    }

    public function destroy(AcademicSession $academicSession)
    {
        $academicSession->delete();

        return response()->json([
            'message' => 'Academic Session deleted successfully.',
        ]);
    }
}
