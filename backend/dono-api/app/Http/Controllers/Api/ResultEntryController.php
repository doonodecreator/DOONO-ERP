<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\ResultSubmission;
use App\Models\AssessmentStructure;
use App\Models\FormTeacherAssignment;
use App\Models\GradingSystem;
use App\Models\Staff;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Term;
use App\Models\Timetable;
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

        $schoolId = $this->requireSchool($request);

        abort_unless($schoolId, 422, 'No school assigned to the current user context.');
        abort_unless(ClassModel::whereKey($request->class_id)->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected class does not belong to the active school.');
        $this->assertTeachingScope($request, $schoolId, (int) $request->class_id);

        $students = StudentEnrollment::with('student')
            ->where('school_id', $schoolId)
            ->where('class_id', $request->class_id)
            ->where('status', 'Active')
            ->get();

        $subjectsQuery = Subject::where('school_id', $schoolId)->where('is_active', true);
        $staff = Staff::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();
        if ($staff && $request->user()->hasRole('teacher', $schoolId)) {
            $subjectIds = Timetable::query()
                ->where('school_id', $schoolId)
                ->where('staff_id', $staff->id)
                ->where('class_id', $request->class_id)
                ->pluck('subject_id');
            $subjectsQuery->whereIn('id', $subjectIds);
        }
        $subjects = $subjectsQuery->get();
        $sessions = AcademicSession::where('school_id', $schoolId)->where('status', 'active')->get();
        $terms = Term::whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId))->with('academicSession:id,name')->get();
        $structures = AssessmentStructure::where('school_id', $schoolId)->where('is_active', true)->orderBy('display_order')->get();
        $gradingRules = GradingSystem::query()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderByDesc('minimum_score')
            ->orderBy('display_order')
            ->get(['id', 'minimum_score', 'maximum_score', 'grade', 'remark']);

        return response()->json([
            'students' => $students,
            'subjects' => $subjects,
            'sessions' => $sessions,
            'terms' => $terms,
            'structures' => $structures,
            'grading_rules' => $gradingRules,
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

        $schoolId = $this->requireSchool($request);

        if (! $schoolId) {
            return response()->json([
                'message' => 'No school assigned to the current user context.',
            ], 422);
        }

        abort_unless(Subject::whereKey($validated['subject_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected subject does not belong to the active school.');
        abort_unless(AcademicSession::whereKey($validated['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected academic session does not belong to the active school.');
        abort_unless(Term::whereKey($validated['term_id'])->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId)->whereKey($validated['academic_session_id']))->exists(), 422, 'The selected term does not belong to the active school session.');
        $enrollmentIds = collect($validated['students'])->pluck('student_enrollment_id');
        $this->assertTeachingScope($request, $schoolId, $this->enrollmentClassId($schoolId, $enrollmentIds), (int) $validated['subject_id']);
        abort_unless(StudentEnrollment::where('school_id', $schoolId)->whereIn('id', $enrollmentIds)->where('status', 'Active')->count() === $enrollmentIds->unique()->count(), 422, 'One or more selected students do not belong to the active school.');
        $structureIds = collect($validated['students'])->flatMap(fn ($student) => collect($student['components'])->pluck('assessment_structure_id'))->unique();
        abort_unless(AssessmentStructure::where('school_id', $schoolId)->whereIn('id', $structureIds)->where('is_active', true)->count() === $structureIds->count(), 422, 'One or more assessment structures do not belong to the active school.');
        $submission = null;
        if (!empty($validated['result_submission_id'])) {
            $submission = ResultSubmission::query()
                ->whereKey($validated['result_submission_id'])
                ->where('school_id', $schoolId)
                ->where('subject_id', $validated['subject_id'])
                ->where('academic_session_id', $validated['academic_session_id'])
                ->where('term_id', $validated['term_id'])
                ->firstOrFail();
            abort_unless(in_array($submission->status, ['draft', 'in_progress'], true), 422, 'Only draft or in-progress submissions can receive score changes.');
            abort_unless(StudentEnrollment::where('school_id', $schoolId)->where('class_id', $submission->class_id)->whereIn('id', $enrollmentIds)->count() === $enrollmentIds->unique()->count(), 422, 'One or more selected students do not belong to the submission class.');
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

    private function enrollmentClassId(int $schoolId, $enrollmentIds): int
    {
        $classIds = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->whereIn('id', $enrollmentIds)
            ->pluck('class_id')
            ->unique();

        abort_unless($classIds->count() === 1, 422, 'All selected students must belong to one class.');

        return (int) $classIds->first();
    }

    private function assertTeachingScope(Request $request, int $schoolId, int $classId, ?int $subjectId = null): void
    {
        $user = $request->user();
        if (! $user->hasRole('teacher', $schoolId) && ! $user->hasRole('form_teacher', $schoolId)) {
            return;
        }

        $staffId = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->value('id');

        abort_unless($staffId, 403, 'No active teaching staff record is linked to this account.');

        if ($user->hasRole('teacher', $schoolId)) {
            $timetable = Timetable::query()
                ->where('school_id', $schoolId)
                ->where('staff_id', $staffId)
                ->where('class_id', $classId)
                ->when($subjectId, fn ($query) => $query->where('subject_id', $subjectId))
                ->exists();

            abort_unless($timetable, 403, 'You may only enter scores for your assigned timetable class and subject.');
            return;
        }

        $assigned = FormTeacherAssignment::query()
            ->where('school_id', $schoolId)
            ->where('staff_id', $staffId)
            ->where('class_id', $classId)
            ->where('is_active', true)
            ->exists();

        abort_unless($assigned, 403, 'You may only enter scores for your assigned form class.');
    }
}

