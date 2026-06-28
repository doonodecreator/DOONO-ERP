<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentEnrollmentRequest;
use App\Http\Requests\UpdateStudentEnrollmentRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\StudentEnrollment;

class StudentEnrollmentController extends Controller
{
    public function index()
    {
        return StudentEnrollmentResource::collection(
            StudentEnrollment::latest()->paginate(10)
        );
    }

    public function store(StoreStudentEnrollmentRequest $request)
    {
        $studentEnrollment = StudentEnrollment::create($request->validated());

        return new StudentEnrollmentResource($studentEnrollment);
    }

    public function show(StudentEnrollment $studentEnrollment)
    {
        return new StudentEnrollmentResource($studentEnrollment);
    }

    public function update(UpdateStudentEnrollmentRequest $request, StudentEnrollment $studentEnrollment)
    {
        $studentEnrollment->update($request->validated());

        return new StudentEnrollmentResource($studentEnrollment);
    }

    public function destroy(StudentEnrollment $studentEnrollment)
    {
        $studentEnrollment->delete();

        return response()->json([
            'message' => 'Student enrollment deleted successfully.'
        ]);
    }
}
