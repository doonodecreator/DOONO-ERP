<?php

namespace App\Services\Academic;

use App\Models\Result;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;

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
     * Process a single subject result.
     */
    public function process(Result $result): Result
    {
        $this->assessmentService->computeComponents($result->id);

        $total = $this->assessmentService->computeSubjectTotal($result->id);

        $result->total_score = $total;

        $result->grade = $this->gradeService->getGrade(
            $result->school_id,
            $total
        );

        $result->remark = $this->gradeService->getRemark(
            $result->school_id,
            $total
        );

        $result->save();

        $this->recalculateSubjectPositions(
            $result->subject_id,
            $result->studentEnrollment->class_id,
            $result->academic_session_id,
            $result->term_id
        );

        return $result;
    }

    /**
     * Rebuild a student's summary.
     */
    public function rebuildStudentSummary(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): void {
        $results = Result::where('student_enrollment_id', $studentEnrollmentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        if ($results->isEmpty()) {
            return;
        }

        $student = StudentEnrollment::findOrFail($studentEnrollmentId);

        $subjectsOffered = $results->count();
        $subjectsPassed = $results->where('total_score', '>=', 40)->count();
        $subjectsFailed = $results->where('total_score', '<', 40)->count();

        $totalScore = round($results->sum('total_score'), 2);
        $studentAverage = round($results->avg('total_score'), 2);

        $overallGrade = $this->gradeService->getGrade($student->school_id, $studentAverage);
        $overallRemark = $this->gradeService->getRemark($student->school_id, $studentAverage);

        $summary = StudentResultSummary::updateOrCreate(
            [
                'student_enrollment_id' => $studentEnrollmentId,
                'academic_session_id' => $sessionId,
                'term_id' => $termId,
            ],
            [
                'school_id' => $student->school_id,
                'class_id' => $student->class_id,
                'total_score' => $totalScore,
                'student_average' => $studentAverage,
                'subjects_offered' => $subjectsOffered,
                'subjects_passed' => $subjectsPassed,
                'subjects_failed' => $subjectsFailed,
                'overall_grade' => $overallGrade,
                'overall_remark' => $overallRemark,
            ]
        );

        // Calculate Class Metrics
        $classSummaries = StudentResultSummary::where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        if ($classSummaries->isNotEmpty()) {
            $classAverage = round($classSummaries->avg('student_average'), 2);
            $highestAverage = round($classSummaries->max('student_average'), 2);
            $lowestAverage = round($classSummaries->min('student_average'), 2);

            foreach ($classSummaries as $item) {
                $item->class_average = $classAverage;
                $item->highest_average = $highestAverage;
                $item->lowest_average = $lowestAverage;
                $item->save();
            }

            // Recalculate class rank positions
            $this->recalculateRankings($student->class_id, $sessionId, $termId);
        }

        // Evaluate promotion status
        $this->updatePromotion($studentEnrollmentId, $sessionId, $termId);
    }

    /**
     * Recalculate subject positions within a class.
     */
    public function recalculateSubjectPositions(
        int $subjectId,
        int $classId,
        int $sessionId,
        int $termId
    ): void {
        $results = Result::with('studentEnrollment')
            ->where('subject_id', $subjectId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get()
            ->filter(fn ($result) => $result->studentEnrollment && $result->studentEnrollment->class_id == $classId)
            ->sortByDesc('total_score')
            ->values();

        if ($results->isEmpty()) {
            return;
        }

        $rank = 1;
        $position = 1;
        $previousScore = null;

        foreach ($results as $result) {
            if ($previousScore !== null && $result->total_score < $previousScore) {
                $position = $rank;
            }

            $result->position = $position;
            $result->save();

            $previousScore = $result->total_score;
            $rank++;
        }
    }

    /**
     * Recalculate overall class rankings.
     */
    public function recalculateRankings(
        int $classId,
        int $sessionId,
        int $termId
    ): void {
        $summaries = StudentResultSummary::where('class_id', $classId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        if ($summaries->isEmpty()) {
            return;
        }

        $rankingData = $summaries->map(fn ($s) => [
            'id' => $s->id,
            'average' => $s->student_average,
        ])->toArray();

        $rankedStudents = $this->rankingService->rankStudents($rankingData);

        foreach ($rankedStudents as $student) {
            StudentResultSummary::where('id', $student['id'])->update([
                'position' => $student['position'],
            ]);
        }
    }

    /**
     * Evaluate and update promotion status.
     */
    public function updatePromotion(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): void {
        $summary = StudentResultSummary::where('student_enrollment_id', $studentEnrollmentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->first();

        if (! $summary) {
            return;
        }

        $promotionResult = $this->promotionService->determinePromotion(
            $summary->school_id,
            $summary->student_average,
            $summary->subjects_failed
        );

        $summary->promotion_status = $promotionResult['status'];
        $summary->save();
    }
}
