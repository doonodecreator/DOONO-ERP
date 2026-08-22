<?php

namespace App\Services\Academic;

use App\Models\AcademicConfiguration;
use App\Models\Attendance;
use App\Models\ParentModel;
use App\Models\Result;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;
use App\Services\Academic\ResultProcessingService;
use App\Services\MediaStorageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class ReportCardService
{
    public function __construct(
        protected ResultProcessingService $processingService,
        protected MediaStorageService $media,
    ) {}

    /**
     * Generate complete report card payload for a student enrollment.
     */
    public function generatePayload(
        StudentEnrollment $enrollment,
        int $academicSessionId,
        int $termId,
        bool $inlineMedia = false,
    ): array {
        $schoolId = $enrollment->school_id;
        $school = $enrollment->relationLoaded('school') ? $enrollment->school : $enrollment->load('school')->school;
        $academicConfiguration = AcademicConfiguration::query()->where('school_id', $schoolId)->first();
        $schoolSettings = DB::table('school_settings')->where('school_id', $schoolId)->first();

        // Fetch subject results for the term
        $subjectResults = Result::with([
            'subject',
            'components.assessmentStructure',
        ])
        ->where('school_id', $schoolId)
        ->where('student_enrollment_id', $enrollment->id)
        ->where('academic_session_id', $academicSessionId)
        ->where('term_id', $termId)
        ->orderBy('subject_id')
        ->get();

        // Retrieve or calculate result summary
        $summary = StudentResultSummary::where('school_id', $schoolId)
            ->where('student_enrollment_id', $enrollment->id)
            ->where('academic_session_id', $academicSessionId)
            ->where('term_id', $termId)
            ->first();

        if (! $summary && $subjectResults->isNotEmpty()) {
            $this->processingService->rebuildStudentSummary($enrollment->id, $academicSessionId, $termId);
            $summary = StudentResultSummary::query()
                ->where('school_id', $schoolId)
                ->where('student_enrollment_id', $enrollment->id)
                ->where('academic_session_id', $academicSessionId)
                ->where('term_id', $termId)
                ->first();
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

        $student = $enrollment->load(['student', 'class', 'stream', 'school', 'academicSession', 'term']);
        $reportCardLogo = $school?->report_card_logo ?: $school?->logo;

        return [
            'student' => $student,
            'parent' => $parent,
            'school' => $school,
            'school_settings' => $schoolSettings,
            'academicSession' => $student->academicSession,
            'term' => $student->term,
            'summary' => $summary,
            'subject_results' => $subjectResults,
            'academic_configuration' => $academicConfiguration,
            'branding' => [
                'logo' => $inlineMedia ? $this->media->inlineDataUri($reportCardLogo) : $this->media->url($reportCardLogo),
                'principal_signature' => $inlineMedia ? $this->media->inlineDataUri($school?->principal_signature) : $this->media->url($school?->principal_signature),
                'school_stamp' => $inlineMedia ? $this->media->inlineDataUri($school?->school_stamp) : $this->media->url($school?->school_stamp),
                'primary_color' => $school?->primary_color ?: '#1E40AF',
                'secondary_color' => $school?->secondary_color ?: '#FFFFFF',
                'accent_color' => $school?->accent_color ?: '#F59E0B',
                'theme' => $school?->report_card_theme ?: 'classic',
                'layout' => $school?->report_card_layout ?: 'standard',
                'custom_header' => $school?->custom_header,
                'custom_footer' => $school?->custom_footer,
                'show_watermark' => (bool) ($school?->show_watermark ?? true),
                'watermark_text' => $school?->watermark_text ?: 'Powered by DOONO De Creator ERP',
                'student_photo' => $academicConfiguration?->show_student_passport === false
                    ? null
                    : ($inlineMedia ? $this->media->inlineDataUri($student->student?->photo) : $this->media->url($student->student?->photo)),
            ],
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
        $payload = $this->generatePayload($enrollment, $academicSessionId, $termId, true);

        $orientation = ($payload['branding']['layout'] ?? 'standard') === 'landscape' ? 'landscape' : 'portrait';
        $pdf = Pdf::loadView($viewName, $payload)
            ->setPaper('a4', $orientation);

        $fileName = sprintf(
            'ReportCard_%s_%s.pdf',
            str_replace(' ', '_', $payload['student']->student->full_name ?? 'Student'),
            now()->format('Y_m_d')
        );

        return $pdf->download($fileName);
    }
}
