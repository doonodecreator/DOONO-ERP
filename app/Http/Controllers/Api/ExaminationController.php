<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExaminationRequest;
use App\Http\Requests\UpdateExaminationRequest;
use App\Http\Resources\ExaminationResource;
use App\Models\Examination;

class ExaminationController extends Controller
{
    public function index()
    {
        return ExaminationResource::collection(
            Examination::with([
                'school',
                'academicSession',
                'term'
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreExaminationRequest $request)
    {
        $examination = Examination::create($request->validated());

        return (new ExaminationResource(
            $examination->load([
                'school',
                'academicSession',
                'term'
            ])
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Examination $examination)
    {
        return new ExaminationResource(
            $examination->load([
                'school',
                'academicSession',
                'term'
            ])
        );
    }

    public function update(UpdateExaminationRequest $request, Examination $examination)
    {
        $examination->update($request->validated());

        return new ExaminationResource(
            $examination->load([
                'school',
                'academicSession',
                'term'
            ])
        );
    }

    public function destroy(Examination $examination)
    {
        $examination->delete();

        return response()->json([
            'message' => 'Examination deleted successfully.',
        ]);
    }
}
