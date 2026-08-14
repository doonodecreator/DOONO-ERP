<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentEnrollmentRequest;
use App\Http\Requests\UpdateStudentEnrollmentRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;

class StudentEnrollmentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
    public function index(Request $request)
    {
        $query = StudentEnrollment::with([
            'student',
            'school',
            'academicSession',
            'term',
            'division',
            'class',
            'stream',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $this->currentContextSchoolId($request)
            );
        }

        return StudentEnrollmentResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreStudentEnrollmentRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            $data['school_id'] = $this->currentContextSchoolId($request);
        }

        $enrollment = StudentEnrollment::create($data);

        return (new StudentEnrollmentResource(
            $enrollment->load([
                'student',
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, StudentEnrollment $studentEnrollment)
    {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentEnrollment->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        return new StudentEnrollmentResource(
            $studentEnrollment->load([
                'student',
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
            ])
        );
    }

    public function update(
        UpdateStudentEnrollmentRequest $request,
        StudentEnrollment $studentEnrollment
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentEnrollment->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            unset($data['school_id']);
        }

        $studentEnrollment->update($data);

        return new StudentEnrollmentResource(
            $studentEnrollment->load([
                'student',
                'school',
                'academicSession',
                'term',
                'division',
                'class',
                'stream',
            ])
        );
    }

    public function destroy(
        Request $request,
        StudentEnrollment $studentEnrollment
    ) {
        if (
            ! $request->user()->isSuperAdmin() &&
            $studentEnrollment->school_id != $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $studentEnrollment->delete();

        return response()->json([
            'message' => 'Student enrollment deleted successfully.'
        ]);
    }
}
