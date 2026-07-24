<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\ResultEntryService;
use App\Models\StudentEnrollment;
use App\Models\AssessmentStructure;
use App\Models\Subject;
use App\Models\AcademicSession;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResultEntryController extends Controller
{
    public function __construct(
        protected ResultEntryService $resultEntryService
    ) {
    }

    /**
     * Load students and dropdown data.
     */
    public function students(Request $request): JsonResponse
    {
        $students = StudentEnrollment::with([
            'student',
        ])
        ->where(
            'class_id',
            $request->class_id
        )
        ->orderBy('id')
        ->get();

        return response()->json([

            'students' => $students,

            'subjects' => Subject::where(
                'is_active',
                true
            )->get(),

            'sessions' => AcademicSession::orderBy(
                'id'
            )->get(),

            'terms' => Term::orderBy(
                'id'
            )->get(),

            'structures' => AssessmentStructure::where(
                'is_active',
                true
            )
            ->orderBy('display_order')
            ->get(),

        ]);
    }

    /**
     * Result entry form endpoint.
     */
    public function form(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Result entry form endpoint is ready.'
        ]);
    }

    /**
     * Save results.
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'integer'],
            'subject_id' => ['required', 'integer'],
            'academic_session_id' => ['required', 'integer'],
            'term_id' => ['required', 'integer'],
            'result_submission_id' => ['nullable', 'integer'],
            'students' => ['required', 'array'],

            'students.*.student_enrollment_id' => [
                'required',
                'integer',
            ],

            'students.*.components' => [
                'required',
                'array',
            ],

            'students.*.components.*.assessment_structure_id' => [
                'required',
                'integer',
            ],

            'students.*.components.*.score' => [
                'required',
                'numeric',
            ],
        ]);

        $saved = [];

        foreach ($validated['students'] as $student) {

            $saved[] = $this->resultEntryService
                ->saveStudentResult([

                    'school_id' => $validated['school_id'],

                    'subject_id' => $validated['subject_id'],

                    'academic_session_id' => $validated['academic_session_id'],

                    'term_id' => $validated['term_id'],

                    'result_submission_id' =>
                        $validated['result_submission_id'] ?? null,

                    'student_enrollment_id' =>
                        $student['student_enrollment_id'],

                    'components' =>
                        $student['components'],

                ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($saved) . ' student result(s) saved successfully.',
            'data' => $saved,
        ]);
    }
}
