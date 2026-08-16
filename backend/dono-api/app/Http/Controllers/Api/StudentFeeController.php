<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentFeeRequest;
use App\Http\Requests\UpdateStudentFeeRequest;
use App\Http\Resources\StudentFeeResource;
use App\Models\StudentFee;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StudentFeeController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return StudentFeeResource::collection(
            StudentFee::when($schoolId, function ($query) use ($schoolId) {
                $query->whereHas('studentEnrollment.student', fn($q) => $q->where('school_id', $schoolId));
            })
            ->with([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreStudentFeeRequest $request)
    {
        $data = $request->validated();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $data['school_id'] = $schoolId;
        }

        $studentFee = StudentFee::create($data);

        return (new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment.student',
                'feeCategory',
                'academicSession',
                'term',
                'payments',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, StudentFee $studentFee)
    {
        return new StudentFeeResource(
            $studentFee->load([
                'studentEnrollment.student',
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
                'studentEnrollment.student',
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
