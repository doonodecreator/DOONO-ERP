<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmissionRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Services\AdmissionService;
use App\Services\ActivityLogService;

class AdmissionController extends Controller
{
    public function __construct(
        private readonly AdmissionService $admissions
    ) {}

    public function store(StoreAdmissionRequest $request)
    {
        $enrollment = $this->admissions->admit(
            $request,
            $request->validated()
        );
        ActivityLogService::log(
            module: 'admissions',
            action: 'student_admitted',
            description: 'A student was admitted and assigned an automatic admission number.',
            subject: $enrollment->student,
            schoolId: $enrollment->school_id,
            properties: [
                'student_id' => $enrollment->student_id,
                'enrollment_id' => $enrollment->id,
                'admission_number' => $enrollment->student?->admission_number,
                'academic_session_id' => $enrollment->academic_session_id,
                'term_id' => $enrollment->term_id,
            ],
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
}
