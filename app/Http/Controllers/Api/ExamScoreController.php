<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExamScoreRequest;
use App\Http\Requests\UpdateExamScoreRequest;
use App\Http\Resources\ExamScoreResource;
use App\Models\ExamScore;

class ExamScoreController extends Controller
{
    public function index()
    {
        return ExamScoreResource::collection(
            ExamScore::with([
                'studentEnrollment',
                'classSubject',
                'examination',
                'staff',
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreExamScoreRequest $request)
    {
        $examScore = ExamScore::create($request->validated());

        return (new ExamScoreResource(
            $examScore->load([
                'studentEnrollment',
                'classSubject',
                'examination',
                'staff',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(ExamScore $examScore)
    {
        return new ExamScoreResource(
            $examScore->load([
                'studentEnrollment',
                'classSubject',
                'examination',
                'staff',
            ])
        );
    }

    public function update(UpdateExamScoreRequest $request, ExamScore $examScore)
    {
        $examScore->update($request->validated());

        return new ExamScoreResource(
            $examScore->load([
                'studentEnrollment',
                'classSubject',
                'examination',
                'staff',
            ])
        );
    }

    public function destroy(ExamScore $examScore)
    {
        $examScore->delete();

        return response()->json([
            'message' => 'Exam score deleted successfully.',
        ]);
    }
}
