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
        $this->assessmentService->computeComponents(
            $result->id
        );

        $total = $this->assessmentService
            ->computeSubjectTotal($result->id);

        $result->total_score = $total;

        $result->grade = $this->gradeService
            ->getGrade(
                $result->school_id,
                $total
            );

        $result->remark = $this->gradeService
            ->getRemark(
                $result->school_id,
                $total
            );

        $result->save();

        /*
        |--------------------------------------------------------------------------
        | NEW
        |--------------------------------------------------------------------------
        */

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

        $results = Result::where(
                'student_enrollment_id',
                $studentEnrollmentId
            )
            ->where(
                'academic_session_id',
                $sessionId
            )
            ->where(
                'term_id',
                $termId
            )
            ->get();

        if ($results->isEmpty()) {
            return;
        }

        $student = StudentEnrollment::findOrFail(
            $studentEnrollmentId
        );

        $subjectsOffered = $results->count();

        $subjectsPassed = $results
            ->where('total_score', '>=', 40)
            ->count();

        $subjectsFailed = $results
            ->where('total_score', '<', 40)
            ->count();

        $totalScore = round(
            $results->sum('total_score'),
            2
        );

        $studentAverage = round(
            $results->avg('total_score'),
            2
        );

        $overallGrade = $this->gradeService
            ->getGrade(
                $student->school_id,
                $studentAverage
            );

        $overallRemark = $this->gradeService
            ->getRemark(
                $student->school_id,
                $studentAverage
            );

        StudentResultSummary::updateOrCreate(
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

        $classSummaries = StudentResultSummary::where(
                'school_id',
                $student->school_id
            )
            ->where(
                'class_id',
                $student->class_id
            )
            ->where(
                'academic_session_id',
                $sessionId
            )
            ->where(
                'term_id',
                $termId
            )
            ->get();

        if ($classSummaries->isEmpty()) {
            return;
        }

        $classAverage = round(
            $classSummaries->avg('student_average'),
            2
        );

        $highestAverage = round(
            $classSummaries->max('student_average'),
            2
        );

        $lowestAverage = round(
            $classSummaries->min('student_average'),
            2
        );

        foreach ($classSummaries as $summary) {
            $summary->class_average = $classAverage;
            $summary->highest_average = $highestAverage;
            $summary->lowest_average = $lowestAverage;
            $summary->save();
        }

        $rankingData = [];

        foreach ($classSummaries as $summary) {
            $rankingData[] = [
                'id' => $summary->id,
                'average' => $summary->student_average,
            ];
        }

        $rankedStudents = $this->rankingService
            ->rankStudents($rankingData);

        foreach ($rankedStudents as $rank) {
            StudentResultSummary::where(
                'id',
                $rank['id']
            )->update([
                'position' => $rank['position'],
            ]);
        }
    }

    /**
     * Recalculate subject positions.
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
            ->filter(function ($result) use ($classId) {
                return $result->studentEnrollment
                    && $result->studentEnrollment->class_id == $classId;
            })
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

        $summaries = StudentResultSummary::where(
                'class_id',
                $classId
            )
            ->where(
                'academic_session_id',
                $sessionId
            )
            ->where(
                'term_id',
                $termId
            )
            ->get();

        if ($summaries->isEmpty()) {
            return;
        }

        $rankingData = [];

        foreach ($summaries as $summary) {
            $rankingData[] = [
                'id' => $summary->id,
                'average' => $summary->student_average,
            ];
        }

        $rankedStudents = $this->rankingService
            ->rankStudents($rankingData);

        foreach ($rankedStudents as $student) {
            StudentResultSummary::where(
                'id',
                $student['id']
            )->update([
                'position' => $student['position'],
            ]);
        }
    }

    /**
     * Promotion processing.
     */
    public function updatePromotion(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): void {

        $summary = StudentResultSummary::where(
                'student_enrollment_id',
                $studentEnrollmentId
            )
            ->where(
                'academic_session_id',
                $sessionId
            )
            ->where(
                'term_id',
                $termId
            )
            ->first();

        if (!$summary) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Promotion logic will be implemented later.
        |--------------------------------------------------------------------------
        */

        return;
    }
}
