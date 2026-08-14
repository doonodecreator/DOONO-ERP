<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdmissionService
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    public function admit(Request $request, array $data): StudentEnrollment
    {
        $schoolId = $this->currentSchoolId($request);

        if (! $schoolId) {
            throw ValidationException::withMessages([
                'school_id' => ['A school context is required for admission.'],
            ]);
        }

        return DB::transaction(function () use ($data, $schoolId) {
            $studentData = Arr::except($data, [
                'term_id',
                'enrollment_date',
            ]);

            $studentData['school_id'] = $schoolId;
            $studentData['status'] = 'Active';

            $student = Student::create($studentData);

            return StudentEnrollment::create([
                'student_id' => $student->id,
                'school_id' => $schoolId,
                'academic_session_id' => $data['academic_session_id'],
                'term_id' => $data['term_id'],
                'division_id' => $data['division_id'],
                'class_id' => $data['class_id'],
                'stream_id' => $data['stream_id'] ?? null,
                'enrollment_date' => $data['enrollment_date'],
                'status' => 'Active',
            ]);
        });
    }

    private function currentSchoolId(Request $request): ?int
    {
        $schoolId = $request->attributes->get('current_school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        return $this->context->currentSchool($request->user())?->id;
    }
}
