<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentEnrollmentRequest;
use App\Http\Requests\UpdateStudentEnrollmentRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentEnrollmentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;
    }
    public function index(Request $request)
    {
        $validated = $request->validate([
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

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
            $query->latest()->paginate($validated['per_page'] ?? 10)
        );
    }

    public function store(StoreStudentEnrollmentRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->currentContextSchoolId($request);

        $enrollment = DB::transaction(function () use ($data) {
            $enrollment = StudentEnrollment::create($data);
            $this->syncCurrentStudentPlacement($enrollment);

            return $enrollment;
        });

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
        unset($data['school_id']);

        DB::transaction(function () use ($studentEnrollment, $data) {
            $studentEnrollment->update($data);
            $this->syncCurrentStudentPlacement($studentEnrollment);
        });

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

    private function syncCurrentStudentPlacement(
        StudentEnrollment $enrollment
    ): void {
        $enrollment->loadMissing(['student', 'academicSession', 'term']);

        if (
            $enrollment->status !== 'Active' ||
            ! $enrollment->academicSession?->is_current ||
            ! $enrollment->term?->is_current
        ) {
            return;
        }

        $enrollment->student->update([
            'division_id' => $enrollment->division_id,
            'class_id' => $enrollment->class_id,
            'stream_id' => $enrollment->stream_id,
            'academic_session_id' => $enrollment->academic_session_id,
            'status' => 'Active',
        ]);
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
