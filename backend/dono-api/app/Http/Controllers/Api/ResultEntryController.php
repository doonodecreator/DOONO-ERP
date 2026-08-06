<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\AssessmentStructure;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Term;
use App\Services\Academic\ResultEntryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultEntryController extends Controller
{
    public function __construct(
        protected ResultEntryService $resultEntryService
    ) {}

    /**
     * Load the result entry form status.
     */
    public function form(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Result entry form endpoint is ready.',
        ]);
    }

    /**
     * Load students, subjects, and assessment structures scoped to the current school.
     */
    public function students(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
        ]);

        $user = $request->user();
        $schoolId = $user->isSuperAdmin() ? $request->input('school_id') : $user->currentSchoolId();

        $students = StudentEnrollment::with('student')
            ->where('school_id', $schoolId)
            ->where('class_id', $request->class_id)
            ->get();

        $subjects = Subject::where('school_id', $schoolId)->get();
        $sessions = AcademicSession::where('school_id', $schoolId)->get();
        $terms = Term::where('school_id', $schoolId)->get();
        $structures = AssessmentStructure::where('school_id', $schoolId)->get();

        return response()->json([
            'students' => $students,
            'subjects' => $subjects,
            'sessions' => $sessions,
            'terms' => $terms,
            'structures' => $structures,
        ]);
    }

    /**
     * Save results for an entire class in a single transaction.
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'term_id' => ['required', 'integer', 'exists:terms,id'],
            'result_submission_id' => ['nullable', 'integer'],
            'students' => ['required', 'array', 'min:1'],

            'students.*.student_enrollment_id' => ['required', 'integer', 'exists:student_enrollments,id'],
            'students.*.components' => ['required', 'array'],
            'students.*.components.*.assessment_structure_id' => ['required', 'integer'],
            'students.*.components.*.score' => ['required', 'numeric', 'min:0'],
        ]);

        $user = $request->user();
        $schoolId = $user->isSuperAdmin() ? $request->input('school_id') : $user->currentSchoolId();

        if (! $schoolId) {
            return response()->json([
                'message' => 'No school assigned to the current user context.',
            ], 422);
        }

        $saved = [];

        DB::transaction(function () use ($validated, $schoolId, &$saved) {
            foreach ($validated['students'] as $student) {
                $saved[] = $this->resultEntryService->saveStudentResult([
                    'school_id' => $schoolId,
                    'subject_id' => $validated['subject_id'],
                    'academic_session_id' => $validated['academic_session_id'],
                    'term_id' => $validated['term_id'],
                    'result_submission_id' => $validated['result_submission_id'] ?? null,
                    'student_enrollment_id' => $student['student_enrollment_id'],
                    'components' => $student['components'],
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => count($saved) . ' student result(s) saved successfully.',
            'data' => $saved,
        ]);
    }
}

