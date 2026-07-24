<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResultRequest;
use App\Http\Requests\UpdateResultRequest;
use App\Http\Resources\ResultResource;
use App\Models\Result;

class ResultController extends Controller
{
    public function index()
    {
        return ResultResource::collection(
            Result::with([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(StoreResultRequest $request)
    {
        $data = $request->validated();

        $data['total_score'] = $data['ca_score'] + $data['exam_score'];

        $data['grade'] = $this->calculateGrade($data['total_score']);
        $data['remark'] = $this->calculateRemark($data['total_score']);

        $result = Result::create($data);

        return (new ResultResource(
            $result->load([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Result $result)
    {
        return new ResultResource(
            $result->load([
                'school',
                'studentEnrollment',
                'subject',
                'academicSession',
                'term',
            ])
        );
    }

    public function update(UpdateResultRequest $request, Result $result)
{
    if ($result->status === 'published') {
        return response()->json([
            'success' => false,
            'message' => 'Published results cannot be edited.'
        ], 403);
    }

    $data = $request->validated();

    if (isset($data['ca_score']) || isset($data['exam_score'])) {

        $ca = $data['ca_score'] ?? $result->ca_score;
        $exam = $data['exam_score'] ?? $result->exam_score;

        $data['total_score'] = $ca + $exam;
        $data['grade'] = $this->calculateGrade($data['total_score']);
        $data['remark'] = $this->calculateRemark($data['total_score']);
    }

    $result->update($data);

    return new ResultResource(
        $result->load([
            'school',
            'studentEnrollment',
            'subject',
            'academicSession',
            'term',
        ])
    );
}

    public function destroy(Result $result)
{
    if ($result->status === 'published') {
        return response()->json([
            'success' => false,
            'message' => 'Published results cannot be deleted.'
        ], 403);
    }

    $result->delete();

    return response()->json([
        'success' => true,
        'message' => 'Result deleted successfully.'
    ]);
}

    private function calculateGrade($score): string
    {
        if ($score >= 70) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 50) return 'C';
        if ($score >= 45) return 'D';
        if ($score >= 40) return 'E';

        return 'F';
    }

    private function calculateRemark($score): string
    {
        if ($score >= 70) return 'Excellent';
        if ($score >= 60) return 'Very Good';
        if ($score >= 50) return 'Good';
        if ($score >= 45) return 'Fair';
        if ($score >= 40) return 'Pass';

        return 'Fail';
    }

    public function publish(Result $result)
{
    $result->update([
        'is_published' => true,
        'published_at' => now(),
        'published_by' => auth()->id(),
        'status' => 'published',
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Result published successfully.',
        'data' => $result,
    ]);
}

}
