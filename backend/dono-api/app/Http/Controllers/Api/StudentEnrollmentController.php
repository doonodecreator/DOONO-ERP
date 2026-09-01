<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentEnrollmentRequest;
use App\Http\Requests\UpdateStudentEnrollmentRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\StudentEnrollment;
use App\Models\Student;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentEnrollmentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}


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
                $this->context->currentSchool($request->user())?->id
            );
        }

        return StudentEnrollmentResource::collection(
            $query->latest()->paginate($validated['per_page'] ?? 10)
        );
    }

    public function store(StoreStudentEnrollmentRequest $request)
    {
        $data = $request->validated();
        $data['school_id'] = $this->context->currentSchool($request->user())?->id;
        $data['status'] = 'Active';

        $enrollment = DB::transaction(function () use ($data) {
            $student = Student::query()
                ->whereKey((int) $data['student_id'])
                ->where('school_id', (int) $data['school_id'])
                ->lockForUpdate()
                ->firstOrFail();

            abort_if(
                in_array($student->status, ['Graduated', 'Transferred', 'Withdrawn'], true),
                422,
                'This student has a terminal lifecycle status. Use the authorized re-admission workflow before creating another enrollment.'
            );

            $enrollment = StudentEnrollment::create($data);
            $this->syncCurrentStudentPlacement($enrollment);

            return $enrollment;
        });
        ActivityLogService::log(
            module: 'enrollments',
            action: 'created',
            description: 'A student enrollment was created as an active placement.',
            subject: $enrollment,
            schoolId: $enrollment->school_id,
            properties: ['student_id' => $enrollment->student_id, 'academic_session_id' => $enrollment->academic_session_id, 'term_id' => $enrollment->term_id],
        );

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
            $studentEnrollment->school_id != $this->context->currentSchool($request->user())?->id
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
            $studentEnrollment->school_id != $this->context->currentSchool($request->user())?->id
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();
        unset($data['school_id']);

        DB::transaction(function () use ($studentEnrollment, $data) {
            $student = Student::query()
                ->whereKey((int) $studentEnrollment->student_id)
                ->where('school_id', (int) $studentEnrollment->school_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (
                in_array($student->status, ['Graduated', 'Transferred', 'Withdrawn'], true)
                && in_array($data['status'] ?? null, ['Active', 'Promoted', 'Repeated'], true)
            ) {
                abort(422, 'A terminal student cannot be reactivated through an enrollment edit. Use the authorized re-admission workflow.');
            }

            $conflict = StudentEnrollment::query()
                ->where('school_id', $studentEnrollment->school_id)
                ->where('student_id', $studentEnrollment->student_id)
                ->where('academic_session_id', $data['academic_session_id'])
                ->where('term_id', $data['term_id'])
                ->where('id', '!=', $studentEnrollment->id)
                ->exists();
            abort_if($conflict, 422, 'This student already has an enrollment for the selected academic session and term.');

            unset($data['student_id'], $data['status']);
            $studentEnrollment->update($data);
            $this->syncCurrentStudentPlacement($studentEnrollment);
        });
        ActivityLogService::log(
            module: 'enrollments',
            action: 'updated',
            description: 'A student enrollment placement was corrected.',
            subject: $studentEnrollment,
            schoolId: $studentEnrollment->school_id,
            properties: ['changed_fields' => array_keys($data)],
        );

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
            $studentEnrollment->school_id != $this->context->currentSchool($request->user())?->id
        ) {
            abort(403, 'Unauthorized.');
        }

        $studentEnrollment->delete();
        ActivityLogService::log(
            module: 'enrollments',
            action: 'deleted',
            description: 'A student enrollment record was deleted.',
            schoolId: $studentEnrollment->school_id,
            properties: ['enrollment_id' => $studentEnrollment->id, 'student_id' => $studentEnrollment->student_id],
        );

        return response()->json([
            'message' => 'Student enrollment deleted successfully.'
        ]);
    }
}
