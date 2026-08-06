<?php

namespace App\Services\Academic;

use App\Models\Attendance;
use App\Models\ParentModel;
use App\Models\Result;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;
use App\Services\ResultComputationService;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportCardService
{
    public function __construct(
        protected ResultComputationService $computationService
    ) {}

    /**
     * Generate complete report card payload for a student enrollment.
     */
    public function generatePayload(
        StudentEnrollment $enrollment,
        int $academicSessionId,
        int $termId
    ): array {
        $schoolId = $enrollment->school_id;

        // Fetch subject results for the term
        $subjectResults = Result::with([
            'subject',
            'components.assessmentStructure',
        ])
        ->where('student_enrollment_id', $enrollment->id)
        ->where('academic_session_id', $academicSessionId)
        ->where('term_id', $termId)
        ->orderBy('subject_id')
        ->get();

        // Retrieve or calculate result summary
        $summary = StudentResultSummary::where('student_enrollment_id', $enrollment->id)
            ->where('academic_session_id', $academicSessionId)
            ->where('term_id', $termId)
            ->first();

        if (! $summary && $subjectResults->isNotEmpty()) {
            $totalScore = $subjectResults->sum('total_score');
            $subjectsOffered = $subjectResults->count();
            $studentAvg = $subjectsOffered > 0 ? round($totalScore / $subjectsOffered, 2) : 0;
            $subjectsPassed = $subjectResults->filter(fn ($r) => ($r->total_score ?? 0) >= 40)->count();
            $subjectsFailed = $subjectsOffered - $subjectsPassed;

            // Class Average & Ranking Calculation
            $classEnrollmentIds = StudentEnrollment::where('class_id', $enrollment->class_id)
                ->where('academic_session_id', $academicSessionId)
                ->pluck('id');

            $allClassTotals = Result::whereIn('student_enrollment_id', $classEnrollmentIds)
                ->where('academic_session_id', $academicSessionId)
                ->where('term_id', $termId)
                ->selectRaw('student_enrollment_id, AVG(total_score) as avg_score')
                ->groupBy('student_enrollment_id')
                ->pluck('avg_score', 'student_enrollment_id')
                ->toArray();

            $classAvg = count($allClassTotals) > 0 ? round(array_sum($allClassTotals) / count($allClassTotals), 2) : 0;

            // Determine Position using ResultComputationService
            $ranks = $this->computationService->calculateRanks($allClassTotals);
            $rawRank = $ranks[$enrollment->id] ?? null;
            $positionStr = $rawRank ? $this->computationService->formatOrdinal($rawRank) : '-';

            $overallGrade = $this->computationService->calculateGrade($schoolId, $studentAvg);
            $overallRemark = $this->computationService->calculateRemark($schoolId, $studentAvg);

            $summary = (object) [
                'subjects_offered' => $subjectsOffered,
                'subjects_passed' => $subjectsPassed,
                'subjects_failed' => $subjectsFailed,
                'total_score' => $totalScore,
                'student_average' => $studentAvg,
                'class_average' => $classAvg,
                'position' => $positionStr,
                'overall_grade' => $overallGrade,
                'overall_remark' => $overallRemark,
            ];
        }

        /* Attendance Metrics */
        $attendance = Attendance::where('student_enrollment_id', $enrollment->id)
            ->where('academic_session_id', $academicSessionId)
            ->where('term_id', $termId)
            ->get();

        $daysPresent = $attendance->where('status', 'Present')->count();
        $daysAbsent = $attendance->where('status', 'Absent')->count();
        $daysLate = $attendance->where('status', 'Late')->count();
        $daysExcused = $attendance->where('status', 'Excused')->count();
        $daysOpened = $attendance->count();

        $attendancePercentage = $daysOpened > 0
            ? round(($daysPresent / $daysOpened) * 100, 2)
            : 0;

        /* Linked Parent Information */
        $parent = ParentModel::whereHas('students', function ($query) use ($enrollment) {
            $query->where('students.id', $enrollment->student_id);
        })->first();

        return [
            'student' => $enrollment->load(['student', 'class', 'stream', 'school']),
            'parent' => $parent,
            'summary' => $summary,
            'subject_results' => $subjectResults,
            'attendance' => [
                'days_present' => $daysPresent,
                'days_absent' => $daysAbsent,
                'days_late' => $daysLate,
                'days_excused' => $daysExcused,
                'days_opened' => $daysOpened,
                'attendance_percentage' => $attendancePercentage,
            ],
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Download or stream the PDF Report Card.
     */
    public function downloadPdf(
        StudentEnrollment $enrollment,
        int $academicSessionId,
        int $termId,
        string $viewName = 'pdf.report-card'
    ) {
        $payload = $this->generatePayload($enrollment, $academicSessionId, $termId);

        $pdf = Pdf::loadView($viewName, $payload)
            ->setPaper('a4', 'portrait');

        $fileName = sprintf(
            'ReportCard_%s_%s.pdf',
            str_replace(' ', '_', $payload['student']->student->full_name ?? 'Student'),
            now()->format('Y_m_d')
        );

        return $pdf->download($fileName);
    }
}
