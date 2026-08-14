<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmissionRequest;
use App\Http\Resources\StudentEnrollmentResource;
use App\Services\AdmissionService;

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
