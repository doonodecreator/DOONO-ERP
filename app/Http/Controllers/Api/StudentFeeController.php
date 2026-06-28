<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentFeeRequest;
use App\Http\Requests\UpdateStudentFeeRequest;
use App\Http\Resources\StudentFeeResource;
use App\Models\StudentFee;

class StudentFeeController extends Controller
{
    public function index()
    {
        return StudentFeeResource::collection(
            StudentFee::with([
                'studentEnrollment',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreStudentFeeRequest $request)
    {
        $studentFee = StudentFee::create($request->validated());

        return (new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(StudentFee $studentFee)
    {
        return new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        );
    }

    public function update(UpdateStudentFeeRequest $request, StudentFee $studentFee)
    {
        $studentFee->update($request->validated());

        return new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        );
    }

    public function destroy(StudentFee $studentFee)
    {
        $studentFee->delete();

        return response()->json([
            'message' => 'Student fee deleted successfully.',
        ]);
    }
}
