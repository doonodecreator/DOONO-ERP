<?php

namespace App\Services\Academic;

use App\Models\AcademicConfiguration;
use App\Models\ClassModel;
use App\Models\ReportCard;
use App\Models\Result;
use App\Models\ResultSubmission;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;
use App\Models\Term;
use Illuminate\Validation\ValidationException;

class ResultProcessingService
{
    public function __construct(
        protected AssessmentComputationService $assessmentService,
        protected GradeService $gradeService,
        protected RankingService $rankingService,
        protected PromotionService $promotionService
    ) {
    }

    /**
     * Process a single subject result using the school's active assessment structures.
     */
    public function process(Result $result): Result
    {
        $result->loadMissing('studentEnrollment');
        $enrollment = $result->studentEnrollment;

        if (!$enrollment || (int) $enrollment->school_id !== (int) $result->school_id) {
            throw ValidationException::withMessages([
                'student_enrollment_id' => 'The result enrollment does not belong to the result school.',
            ]);
        }

        $this->assessmentService->computeComponents($result);
        $total = $this->assessmentService->computeSubjectTotal($result);

        $result->total_score = $total;
        $result->grade = $this->gradeService->getGrade((int) $result->school_id, $total);
        $result->remark = $this->gradeService->getRemark((int) $result->school_id, $total);
        $result->save();

        $this->recalculateSubjectPositions(
            (int) $result->subject_id,
            (int) $enrollment->class_id,
            (int) $result->academic_session_id,
            (int) $result->term_id,
            (int) $result->school_id
        );

        return $result;
    }

    /**
     * Rebuild one student's term summary from school-scoped subject results.
     */
    public function rebuildStudentSummary(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): void {
        $student = StudentEnrollment::query()
            ->whereKey($studentEnrollmentId)
            ->firstOrFail();

        $this->assertAcademicContext($student->school_id, $sessionId, $termId);

        $results = Result::query()
            ->where('school_id', $student->school_id)
            ->where('student_enrollment_id', $studentEnrollmentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->with('subject')
            ->get();

        if ($results->isEmpty()) {
            StudentResultSummary::query()
                ->where('school_id', $student->school_id)
                ->where('student_enrollment_id', $studentEnrollmentId)
                ->where('academic_session_id', $sessionId)
                ->where('term_id', $termId)
                ->delete();
            return;
        }

        $configuration = AcademicConfiguration::query()
            ->where('school_id', $student->school_id)
            ->first();
        $defaultPassMark = (float) ($configuration?->pass_mark ?? 40);

        $subjectsPassed = $results->filter(function (Result $result) use ($defaultPassMark): bool {
            $passMark = (float) ($result->subject?->pass_mark ?? $defaultPassMark);
            return (float) $result->total_score >= $passMark;
        })->count();
        $subjectsOffered = $results->count();
        $subjectsFailed = $subjectsOffered - $subjectsPassed;
        $totalScore = round((float) $results->sum('total_score'), 2);
        $studentAverage = round((float) $results->avg('total_score'), 2);

        $summary = StudentResultSummary::updateOrCreate(
            [
                'school_id' => $student->school_id,
                'student_enrollment_id' => $studentEnrollmentId,
                'academic_session_id' => $sessionId,
                'term_id' => $termId,
            ],
            [
                'class_id' => $student->class_id,
                'total_score' => $totalScore,
                'student_average' => $studentAverage,
                'subjects_offered' => $subjectsOffered,
                'subjects_passed' => $subjectsPassed,
                'subjects_failed' => $subjectsFailed,
                'overall_grade' => $this->gradeService->getGrade((int) $student->school_id, $studentAverage),
                'overall_remark' => $this->gradeService->getRemark((int) $student->school_id, $studentAverage),
            ]
        );

        $classSummaries = StudentResultSummary::query()
            ->where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        if ($classSummaries->isNotEmpty()) {
            $classAverage = round((float) $classSummaries->avg('student_average'), 2);
            $highestAverage = round((float) $classSummaries->max('student_average'), 2);
            $lowestAverage = round((float) $classSummaries->min('student_average'), 2);

            foreach ($classSummaries as $item) {
                $item->update([
                    'class_average' => $classAverage,
                    'highest_average' => $highestAverage,
                    'lowest_average' => $lowestAverage,
                ]);
            }

            $this->recalculateRankings((int) $student->class_id, $sessionId, $termId, (int) $student->school_id);
        }

        $this->updatePromotion($studentEnrollmentId, $sessionId, $termId);
    }

    /**
     * Recalculate subject positions within a class using standard competition ranking.
     */
    public function recalculateSubjectPositions(
        int $subjectId,
        int $classId,
        int $sessionId,
        int $termId,
        int $schoolId
    ): void {
        $results = Result::query()
            ->with('studentEnrollment')
            ->where('school_id', $schoolId)
            ->where('subject_id', $subjectId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get()
            ->filter(fn (Result $result) =>
                $result->studentEnrollment
                && (int) $result->studentEnrollment->school_id === $schoolId
                && $result->studentEnrollment->status === 'Active'
                && (int) $result->studentEnrollment->class_id === $classId
            )
            ->sortByDesc(fn (Result $result) => (float) $result->total_score)
            ->values();

        $position = 1;
        $rank = 1;
        $previousScore = null;

        foreach ($results as $result) {
            if ($previousScore !== null && (float) $result->total_score < (float) $previousScore) {
                $position = $rank;
            }

            $result->update(['position' => $position]);
            $previousScore = $result->total_score;
            $rank++;
        }
    }

    /**
     * Recalculate overall class rankings for one school/class/session/term.
     */
    public function recalculateRankings(
        int $classId,
        int $sessionId,
        int $termId,
        int $schoolId
    ): void {
        $summaries = StudentResultSummary::query()
            ->where('school_id', $schoolId)
            ->where('class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        if ($summaries->isEmpty()) {
            return;
        }

        $rankingData = $summaries->map(fn (StudentResultSummary $summary) => [
            'id' => $summary->id,
            'average' => (float) $summary->student_average,
        ])->values()->toArray();

        foreach ($this->rankingService->rankStudents($rankingData) as $rankedStudent) {
            StudentResultSummary::query()
                ->where('school_id', $schoolId)
                ->whereKey($rankedStudent['id'])
                ->update(['position' => $rankedStudent['position']]);
        }
    }

    /**
     * Evaluate promotion using the school's configured final-term rule.
     */
    public function updatePromotion(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): void {
        $enrollment = StudentEnrollment::query()->findOrFail($studentEnrollmentId);
        $summary = StudentResultSummary::query()
            ->where('school_id', $enrollment->school_id)
            ->where('student_enrollment_id', $studentEnrollmentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->first();

        if (!$summary) {
            return;
        }

        $term = Term::query()
            ->whereKey($termId)
            ->where('academic_session_id', $sessionId)
            ->whereHas('academicSession', fn ($query) => $query->where('school_id', $summary->school_id))
            ->firstOrFail();
        $finalTermId = Term::query()
            ->where('academic_session_id', $sessionId)
            ->orderByDesc('end_date')
            ->orderByDesc('id')
            ->value('id');

        $promotionResult = $this->promotionService->determinePromotion(
            (int) $summary->school_id,
            (float) $summary->student_average,
            (int) $summary->subjects_failed,
            (int) $term->id === (int) $finalTermId
        );

        $summary->update(['promotion_status' => $promotionResult['status']]);
    }

    /**
     * Rebuild summaries and report cards after a submission transition.
     */
    public function syncReportCardsForSubmission(ResultSubmission $submission): void
    {
        $enrollments = StudentEnrollment::query()
            ->where('school_id', $submission->school_id)
            ->where('class_id', $submission->class_id)
            ->where('academic_session_id', $submission->academic_session_id)
            ->where('term_id', $submission->term_id)
            ->where('status', 'Active')
            ->get();

        foreach ($enrollments as $enrollment) {
            $this->rebuildStudentSummary($enrollment->id, $submission->academic_session_id, $submission->term_id);
            $this->syncReportCard($enrollment, $submission->academic_session_id, $submission->term_id);
        }
    }

    /**
     * Persist a report card and publish it only after all configured class subjects are published.
     */
    public function syncReportCard(StudentEnrollment $enrollment, int $sessionId, int $termId): ReportCard
    {
        $summary = StudentResultSummary::query()
            ->where('school_id', $enrollment->school_id)
            ->where('student_enrollment_id', $enrollment->id)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->firstOrFail();

        $class = ClassModel::query()
            ->whereKey($enrollment->class_id)
            ->whereHas('division', fn ($query) => $query->where('school_id', $enrollment->school_id))
            ->firstOrFail();
        $configuredSubjectIds = $class->subjects()
            ->where('subjects.school_id', $enrollment->school_id)
            ->where('subjects.is_active', true)
            ->pluck('subjects.id');

        $submissions = ResultSubmission::query()
            ->where('school_id', $enrollment->school_id)
            ->where('class_id', $enrollment->class_id)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId);
        $requiredSubjects = $configuredSubjectIds->count();
        $publishedSubjects = $requiredSubjects > 0
            ? (clone $submissions)->whereIn('subject_id', $configuredSubjectIds)->where('status', 'published')->distinct('subject_id')->count('subject_id')
            : (clone $submissions)->where('status', 'published')->distinct('subject_id')->count('subject_id');
        $allSubjectsPublished = $requiredSubjects > 0
            ? $publishedSubjects >= $requiredSubjects
            : $publishedSubjects > 0 && (clone $submissions)->where('status', '!=', 'published')->doesntExist();

        $summary->update([
            'is_published' => $allSubjectsPublished,
            'published_at' => $allSubjectsPublished ? ($summary->published_at ?: now()) : null,
        ]);

        return ReportCard::updateOrCreate(
            [
                'school_id' => $enrollment->school_id,
                'student_enrollment_id' => $enrollment->id,
                'academic_session_id' => $sessionId,
                'term_id' => $termId,
            ],
            [
                'total_score' => $summary->total_score,
                'average_score' => $summary->student_average,
                'position' => $summary->position,
                'overall_grade' => $summary->overall_grade,
                'overall_remark' => $summary->overall_remark,
                'promotion_status' => $summary->promotion_status ?: 'Pending',
                'is_published' => $allSubjectsPublished,
            ]
        );
    }

    private function assertAcademicContext(int $schoolId, int $sessionId, int $termId): void
    {
        $term = Term::query()
            ->whereKey($termId)
            ->where('academic_session_id', $sessionId)
            ->whereHas('academicSession', fn ($query) => $query->where('school_id', $schoolId))
            ->exists();

        if (!$term) {
            throw ValidationException::withMessages([
                'academic_context' => 'The result session and term do not belong to the enrollment school.',
            ]);
        }
    }
}
