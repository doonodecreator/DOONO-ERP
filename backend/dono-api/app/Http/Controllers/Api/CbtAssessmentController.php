<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CbtAssessment;
use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Examination;
use App\Models\Subject;
use App\Models\Term;
use App\Models\CbtAssessmentQuestion;
use App\Models\CbtAttempt;
use App\Models\CbtAttemptAnswer;
use App\Models\AssessmentStructure;
use App\Models\Result;
use App\Models\ResultSubmission;
use App\Models\ReportCard;
use App\Services\Academic\ResultEntryService;
use App\Services\Academic\ResultSubmissionService;
use App\Models\CbtQuestion;
use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CbtAssessmentController extends Controller
{
    public function __construct(
        protected ResultSubmissionService $submissionService,
        protected ResultEntryService $resultEntryService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $assessments = CbtAssessment::where('school_id', $schoolId)
            ->with(['class:id,name', 'subject:id,name', 'academicSession:id,name', 'term:id,name', 'creator:id,name'])
            ->withCount(['questions', 'attempts'])
            ->latest()
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        return response()->json($assessments);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($this->isAcademicLeader($request, $schoolId), 403, 'Only academic leadership can assemble CBT assessments.');
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'examination_id' => ['nullable', 'integer', 'exists:examinations,id'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'term_id' => ['required', 'integer', 'exists:terms,id'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:360'],
            'pass_mark' => ['nullable', 'integer', 'min:0'],
            'result_weight' => ['required', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:3'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after:available_from'],
            'shuffle_questions' => ['boolean'],
            'question_ids' => ['required', 'array', 'min:1'],
            'question_ids.*' => ['integer', 'distinct'],
        ]);

        abort_unless(ClassModel::whereKey($data['class_id'])->whereHas('division', fn ($query) => $query->where('school_id', $schoolId))->exists(), 422, 'The selected class does not belong to the active school.');
        abort_unless(Subject::whereKey($data['subject_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected subject does not belong to the active school.');
        abort_unless(AcademicSession::whereKey($data['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected session does not belong to the active school.');
        abort_unless(Term::whereKey($data['term_id'])->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId)->whereKey($data['academic_session_id']))->exists(), 422, 'The selected term does not belong to the selected session.');

        $questions = CbtQuestion::where('school_id', $schoolId)
            ->whereIn('id', $data['question_ids'])
            ->where('is_active', true)
            ->where('approval_status', 'approved')
            ->get();
        abort_unless($questions->count() === count($data['question_ids']), 422, 'Every selected question must be active, approved, and owned by the active school.');
        abort_unless($questions->every(fn ($question) => (int) $question->subject_id === (int) $data['subject_id']), 422, 'Every selected question must belong to the selected subject. Assign a subject to unclassified questions before using them.');
        $currentWeight = (int) AssessmentStructure::where('school_id', $schoolId)->where('is_active', true)->sum('percentage');
        abort_unless($currentWeight + (int) $data['result_weight'] <= 100, 422, 'The selected CBT result weight exceeds the school assessment weight budget. Reduce the weight or deactivate an unused assessment structure.');

        if (!empty($data['examination_id'])) {
            abort_unless(Examination::whereKey($data['examination_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected examination does not belong to the active school.');
        }

        $assessment = DB::transaction(function () use ($data, $questions, $schoolId, $request) {
            $totalMarks = max(1, (int) $questions->sum('marks'));
            $structure = AssessmentStructure::create([
                'school_id' => $schoolId,
                'name' => 'CBT: '.$data['title'].' #'.Str::upper(Str::random(6)),
                'maximum_marks' => $totalMarks,
                'percentage' => (int) $data['result_weight'],
                'display_order' => 99,
                'is_active' => true,
            ]);
            $submission = ResultSubmission::firstOrCreate(
                ['school_id' => $schoolId, 'class_id' => $data['class_id'], 'subject_id' => $data['subject_id'], 'academic_session_id' => $data['academic_session_id'], 'term_id' => $data['term_id']],
                ['created_by' => $request->user()->id, 'status' => 'draft']
            );
            abort_unless(in_array($submission->status, ['draft', 'in_progress'], true), 422, 'The official result submission for this subject is already locked. Reopen it before adding CBT scores.');
            $assessment = CbtAssessment::create([
                ...collect($data)->except('question_ids')->toArray(),
                'school_id' => $schoolId,
                'created_by' => $request->user()->id,
                'assessment_structure_id' => $structure->id,
                'result_submission_id' => $submission->id,
                'total_marks' => $totalMarks,
                'status' => 'draft',
                'results_status' => 'draft',
            ]);

            foreach ($questions->values() as $index => $question) {
                CbtAssessmentQuestion::create([
                    'cbt_assessment_id' => $assessment->id,
                    'cbt_question_id' => $question->id,
                    'display_order' => $index + 1,
                    'marks' => $question->marks,
                    'question_snapshot' => $question->question,
                    'options_snapshot' => $question->options,
                    'correct_answer_snapshot' => $question->correct_answer,
                ]);
            }

            return $assessment;
        });

        return response()->json(['data' => $this->adminAssessment($assessment->fresh()), 'message' => 'CBT assessment saved as draft.'], 201);
    }

    public function show(Request $request, CbtAssessment $cbtAssessment)
    {
        abort_unless((int) $cbtAssessment->school_id === $this->requireSchool($request), 404);
        return response()->json(['data' => $this->adminAssessment($cbtAssessment)]);
    }

    public function publish(Request $request, CbtAssessment $cbtAssessment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtAssessment->school_id === $schoolId, 404);
        abort_unless($this->isAcademicLeader($request, $schoolId), 403, 'Only academic leadership can publish CBT assessments.');
        abort_unless($cbtAssessment->status === 'draft', 422, 'Only draft CBT assessments can be published.');
        abort_unless($cbtAssessment->questions()->exists(), 422, 'Add at least one question before publishing the assessment.');
        abort_unless($cbtAssessment->resultSubmission && in_array($cbtAssessment->resultSubmission->status, ['draft', 'in_progress'], true), 422, 'The linked official result submission is already locked. Reopen it before publishing this assessment.');
        $cbtAssessment->update(['status' => 'published']);
        return response()->json(['data' => $this->adminAssessment($cbtAssessment->fresh()), 'message' => 'CBT assessment published.']);
    }

    public function close(Request $request, CbtAssessment $cbtAssessment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtAssessment->school_id === $schoolId, 404);
        abort_unless($this->isAcademicLeader($request, $schoolId), 403, 'Only academic leadership can close CBT assessments.');
        abort_unless($cbtAssessment->status === 'published', 422, 'Only published CBT assessments can be closed.');
        $cbtAssessment->update(['status' => 'closed']);
        return response()->json(['data' => $cbtAssessment->fresh(), 'message' => 'CBT assessment closed.']);
    }

    public function availableForStudent(Request $request)
    {
        [$schoolId, $enrollment] = $this->studentEnrollment($request);
        $now = now();
        $assessments = CbtAssessment::where('school_id', $schoolId)
            ->where('class_id', $enrollment->class_id)
            ->where('status', 'published')
            ->where(function ($query) use ($now) { $query->whereNull('available_from')->orWhere('available_from', '<=', $now); })
            ->where(function ($query) use ($now) { $query->whereNull('available_until')->orWhere('available_until', '>=', $now); })
            ->withCount(['questions'])
            ->with(['subject:id,name', 'academicSession:id,name', 'term:id,name'])
            ->get()
            ->map(function (CbtAssessment $assessment) use ($enrollment) {
                $attemptsUsed = $assessment->attempts()->where('student_enrollment_id', $enrollment->id)->where('status', 'submitted')->count();
                $latest = $assessment->attempts()->where('student_enrollment_id', $enrollment->id)->latest('attempt_number')->first();
                return [
                    ...$assessment->toArray(),
                    'attempt_status' => $latest?->status,
                    'attempt_id' => $latest?->id,
                    'attempts_used' => $attemptsUsed,
                    'attempts_remaining' => max(0, (int) $assessment->max_attempts - $attemptsUsed),
                ];
            });

        return response()->json(['data' => $assessments]);
    }

    public function startForStudent(Request $request, CbtAssessment $cbtAssessment)
    {
        [$schoolId, $enrollment] = $this->studentEnrollment($request);
        abort_unless((int) $cbtAssessment->school_id === $schoolId && (int) $cbtAssessment->class_id === (int) $enrollment->class_id, 404);
        abort_unless($cbtAssessment->status === 'published', 422, 'This assessment is not open.');
        $now = now();
        abort_unless((!$cbtAssessment->available_from || $cbtAssessment->available_from <= $now) && (!$cbtAssessment->available_until || $cbtAssessment->available_until >= $now), 422, 'This assessment is outside its available time window.');

        $state = DB::transaction(function () use ($cbtAssessment, $schoolId, $enrollment, $now) {
            $latest = CbtAttempt::query()
                ->where('school_id', $schoolId)
                ->where('cbt_assessment_id', $cbtAssessment->id)
                ->where('student_enrollment_id', $enrollment->id)
                ->latest('attempt_number')
                ->lockForUpdate()
                ->first();

            if ($latest && $latest->status === 'in_progress') {
                if ($latest->expires_at && now()->greaterThanOrEqualTo($latest->expires_at)) {
                    return ['expired_attempt_id' => $latest->id];
                }
                return ['attempt' => $latest];
            }

            $attemptNumber = ($latest?->attempt_number ?? 0) + 1;
            abort_unless($attemptNumber <= $cbtAssessment->max_attempts, 422, 'You have used all attempts for this assessment.');
            $expiresAt = $now->copy()->addMinutes($cbtAssessment->duration_minutes);
            if ($cbtAssessment->available_until && $cbtAssessment->available_until->lt($expiresAt)) {
                $expiresAt = $cbtAssessment->available_until;
            }
            $questionOrder = $cbtAssessment->questions()->pluck('id')->values();
            if ($cbtAssessment->shuffle_questions) {
                $questionOrder = $questionOrder->shuffle()->values();
            }

            return ['attempt' => CbtAttempt::create([
                'school_id' => $schoolId,
                'cbt_assessment_id' => $cbtAssessment->id,
                'student_enrollment_id' => $enrollment->id,
                'attempt_number' => $attemptNumber,
                'started_at' => $now,
                'expires_at' => $expiresAt,
                'status' => 'in_progress',
                'total_questions' => $cbtAssessment->questions()->count(),
                'question_order' => $questionOrder->all(),
            ])];
        });

        if (!empty($state['expired_attempt_id'])) {
            return $this->submitForStudent($request, CbtAttempt::findOrFail($state['expired_attempt_id']), true);
        }

        return response()->json(['data' => $this->studentAttempt($state['attempt'])]);
    }

    public function answer(Request $request, CbtAttempt $cbtAttempt)
    {
        $this->assertStudentAttempt($request, $cbtAttempt);
        abort_unless($cbtAttempt->status === 'in_progress', 422, 'This attempt is no longer open.');
        if ($cbtAttempt->expires_at && now()->greaterThanOrEqualTo($cbtAttempt->expires_at)) return $this->submitForStudent($request, $cbtAttempt, true);
        $data = $request->validate(['assessment_question_id' => ['required', 'integer'], 'selected_answer' => ['nullable', 'string', 'max:500']]);
        $question = $cbtAttempt->assessment->questions()->whereKey($data['assessment_question_id'])->firstOrFail();
        $options = is_array($question->options_snapshot) ? $question->options_snapshot : [];
        abort_unless($data['selected_answer'] === null || in_array($data['selected_answer'], $options, true), 422, 'The selected answer is not valid for this question.');
        $cbtAttempt->answers()->updateOrCreate(['cbt_assessment_question_id' => $question->id], ['selected_answer' => $data['selected_answer'], 'answered_at' => now()]);
        return response()->json(['message' => 'Answer saved.', 'data' => ['assessment_question_id' => $question->id]]);
    }

    public function submit(Request $request, CbtAttempt $cbtAttempt)
    {
        return $this->submitForStudent($request, $cbtAttempt, false);
    }

    public function attempts(Request $request, CbtAssessment $cbtAssessment)
    {
        abort_unless((int) $cbtAssessment->school_id === $this->requireSchool($request), 404);
        return response()->json(['data' => $cbtAssessment->attempts()->with(['enrollment.student:id,first_name,last_name,admission_number'])->latest()->paginate(50)]);
    }

    public function reviewResults(Request $request, CbtAssessment $cbtAssessment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtAssessment->school_id === $schoolId, 404);
        abort_unless($this->isAcademicLeader($request, $schoolId), 403, 'Only academic leadership can send CBT results for official review.');
        abort_unless($cbtAssessment->status === 'closed', 422, 'Close the CBT assessment before sending results for official review.');
        abort_unless($cbtAssessment->results_status === 'draft', 422, 'This CBT assessment has already entered the results workflow.');
        abort_unless($cbtAssessment->attempts()->where('status', 'in_progress')->doesntExist(), 422, 'All in-progress attempts must be submitted or expired before review.');
        abort_unless($cbtAssessment->attempts()->where('status', 'submitted')->exists(), 422, 'At least one submitted attempt is required before review.');
        $submission = $cbtAssessment->resultSubmission;
        abort_unless($submission, 422, 'This CBT assessment is not linked to an official result submission.');
        $submission = $this->submissionService->submit($submission);
        $cbtAssessment->update(['results_status' => 'submitted', 'results_reviewed_by' => $request->user()->id, 'results_reviewed_at' => now(), 'review_note' => $request->input('review_note')]);
        return response()->json(['data' => $cbtAssessment->fresh(), 'message' => 'CBT scores sent to the official Results Management review queue.']);
    }

    public function publishResults(Request $request, CbtAssessment $cbtAssessment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $cbtAssessment->school_id === $schoolId, 404);
        abort_unless($this->isAcademicLeader($request, $schoolId), 403, 'Only academic leadership can publish CBT results.');
        abort_unless($cbtAssessment->status === 'closed', 422, 'Close the CBT assessment before publishing its official results.');
        abort_unless($cbtAssessment->results_status === 'submitted', 422, 'Send the CBT results for official review before publishing them.');
        $submission = $cbtAssessment->resultSubmission;
        abort_unless($submission && $submission->status === 'approved', 422, 'Approve the official result submission in Results Management before publishing the final result.');
        $this->submissionService->publish($submission, $request->user()->id);
        $cbtAssessment->update(['results_status' => 'published', 'results_published_at' => now()]);
        return response()->json(['data' => $cbtAssessment->fresh(), 'message' => 'Official final results published. Parents can view them through the published report card.']);
    }

    public function studentResult(Request $request, CbtAttempt $cbtAttempt)
    {
        $this->assertStudentAttempt($request, $cbtAttempt);
        abort_unless($cbtAttempt->status === 'submitted', 422, 'This attempt has not been submitted.');
        $assessment = $cbtAttempt->assessment;
        abort_unless($assessment->results_status === 'published', 403, 'Results have not been published yet.');
        abort_unless(Result::where('school_id', $cbtAttempt->school_id)->where('student_enrollment_id', $cbtAttempt->student_enrollment_id)->where('subject_id', $assessment->subject_id)->where('academic_session_id', $assessment->academic_session_id)->where('term_id', $assessment->term_id)->where('is_published', true)->exists(), 403, 'The official subject result has not been published yet.');
        abort_unless(ReportCard::where('school_id', $cbtAttempt->school_id)->where('student_enrollment_id', $cbtAttempt->student_enrollment_id)->where('academic_session_id', $assessment->academic_session_id)->where('term_id', $assessment->term_id)->where('is_published', true)->exists(), 403, 'The final report card has not been published yet.');
        return response()->json(['data' => $cbtAttempt->load('assessment:id,title,subject_id,total_marks,results_status')]);
    }

    private function syncBestAttemptToOfficialResult(CbtAttempt $attempt): void
    {
        $bestAttempt = CbtAttempt::query()
            ->where('school_id', $attempt->school_id)
            ->where('cbt_assessment_id', $attempt->cbt_assessment_id)
            ->where('student_enrollment_id', $attempt->student_enrollment_id)
            ->where('status', 'submitted')
            ->orderByDesc('percentage')
            ->orderByDesc('score')
            ->orderBy('attempt_number')
            ->firstOrFail();

        $this->syncAttemptToOfficialResult($bestAttempt);
    }

    private function syncAttemptToOfficialResult(CbtAttempt $attempt): void
    {
        $assessment = $attempt->assessment()->with(['assessmentStructure', 'resultSubmission'])->firstOrFail();
        abort_unless($assessment->assessment_structure_id && $assessment->result_submission_id, 422, 'This CBT assessment is not linked to official result computation.');
        $this->submissionService->start($assessment->resultSubmission);
        $this->resultEntryService->saveStudentResult([
            'student_enrollment_id' => $attempt->student_enrollment_id,
            'subject_id' => $assessment->subject_id,
            'academic_session_id' => $assessment->academic_session_id,
            'term_id' => $assessment->term_id,
            'school_id' => $attempt->school_id,
            'result_submission_id' => $assessment->result_submission_id,
            'replace_components' => false,
            'components' => [[
                'assessment_structure_id' => $assessment->assessment_structure_id,
                'score' => (float) $attempt->score,
            ]],
        ]);
    }

    private function isAcademicLeader(Request $request, int $schoolId): bool
    {
        return collect(['proprietor', 'principal', 'vice_principal_academic', 'primary_headmaster', 'secondary_principal'])
            ->contains(fn (string $role) => $request->user()->hasRole($role, $schoolId));
    }

    private function studentEnrollment(Request $request): array
    {
        $schoolId = $this->requireSchool($request);
        $student = Student::where('school_id', $schoolId)->where('user_id', $request->user()->id)->firstOrFail();
        $enrollment = StudentEnrollment::where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->latest()->first();
        abort_unless($enrollment, 409, 'No active student enrollment found.');
        return [$schoolId, $enrollment];
    }

    private function assertStudentAttempt(Request $request, CbtAttempt $attempt): void
    {
        [$schoolId, $enrollment] = $this->studentEnrollment($request);
        abort_unless((int) $attempt->school_id === $schoolId && (int) $attempt->student_enrollment_id === (int) $enrollment->id, 404);
    }

    private function submitForStudent(Request $request, CbtAttempt $attempt, bool $expired)
    {
        $this->assertStudentAttempt($request, $attempt);

        $result = DB::transaction(function () use ($attempt) {
            $lockedAttempt = CbtAttempt::query()
                ->whereKey($attempt->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedAttempt->status === 'submitted') {
                return ['attempt' => $lockedAttempt, 'already_submitted' => true];
            }

            abort_unless($lockedAttempt->status === 'in_progress', 422, 'This attempt is no longer open.');
            $lockedAttempt->load(['assessment.questions', 'answers']);
            $score = 0;
            $correct = 0;

            foreach ($lockedAttempt->assessment->questions as $question) {
                $answer = $lockedAttempt->answers->firstWhere('cbt_assessment_question_id', $question->id);
                $selected = $answer?->selected_answer;
                $isCorrect = $selected !== null && $selected === $question->correct_answer_snapshot;
                $awarded = $isCorrect ? (float) $question->marks : 0;
                if ($isCorrect) {
                    $correct++;
                    $score += $awarded;
                }
                $lockedAttempt->answers()->updateOrCreate(
                    ['cbt_assessment_question_id' => $question->id],
                    [
                        'selected_answer' => $selected,
                        'is_correct' => $isCorrect,
                        'awarded_marks' => $awarded,
                        'answered_at' => $answer?->answered_at ?? now(),
                    ]
                );
            }

            $totalMarks = max(1, (float) $lockedAttempt->assessment->total_marks);
            $lockedAttempt->update([
                'status' => 'submitted',
                'submitted_at' => now(),
                'correct_answers' => $correct,
                'total_questions' => $lockedAttempt->assessment->questions->count(),
                'score' => $score,
                'percentage' => round(($score / $totalMarks) * 100, 2),
            ]);

            return ['attempt' => $lockedAttempt->fresh(), 'already_submitted' => false];
        });

        if (!$result['already_submitted']) {
            $this->syncBestAttemptToOfficialResult($result['attempt']);
        }

        return response()->json([
            'data' => $result['attempt'],
            'message' => $result['already_submitted']
                ? 'Attempt already submitted.'
                : ($expired ? 'Time expired. Your answers were submitted automatically.' : 'Test submitted successfully.'),
        ]);
    }

    private function studentAttempt(CbtAttempt $attempt): array
    {
        $attempt->load(['assessment:id,title,instructions,duration_minutes,total_marks,pass_mark,shuffle_questions', 'assessment.questions:id,cbt_assessment_id,display_order,marks,question_snapshot,options_snapshot', 'answers:id,cbt_attempt_id,cbt_assessment_question_id,selected_answer']);
        $questions = $attempt->assessment->questions;
        if (is_array($attempt->question_order) && $attempt->question_order) {
            $order = array_flip(array_map('intval', $attempt->question_order));
            $questions = $questions->sortBy(fn ($question) => $order[(int) $question->id] ?? PHP_INT_MAX)->values();
        }
        $attempt->assessment->setRelation('questions', $questions->map(fn ($question) => ['id' => $question->id, 'display_order' => $question->display_order, 'marks' => $question->marks, 'question' => $question->question_snapshot, 'options' => $question->options_snapshot]));
        return $attempt->toArray();
    }

    private function adminAssessment(CbtAssessment $assessment): array
    {
        return $assessment->load(['class:id,name', 'subject:id,name', 'academicSession:id,name', 'term:id,name', 'questions:id,cbt_assessment_id,cbt_question_id,display_order,marks'])->toArray();
    }
}
