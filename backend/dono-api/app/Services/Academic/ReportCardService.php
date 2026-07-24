<?php

namespace App\Services\Academic;

use App\Models\Attendance;
use App\Models\ParentModel;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;

class ReportCardService
{
    /**
     * Generate report card data.
     */
    public function generate(
        StudentEnrollment $enrollment,
        int $academicSessionId,
        int $termId
    ): array {

        $summary = StudentResultSummary::where(
            'student_enrollment_id',
            $enrollment->id
        )
        ->where(
            'academic_session_id',
            $academicSessionId
        )
        ->where(
            'term_id',
            $termId
        )
        ->first();

        /*
        |--------------------------------------------------------------------------
        | Attendance
        |--------------------------------------------------------------------------
        */

        $attendance = Attendance::where(
            'student_enrollment_id',
            $enrollment->id
        )
        ->where(
            'academic_session_id',
            $academicSessionId
        )
        ->where(
            'term_id',
            $termId
        )
        ->get();

        /*
        |--------------------------------------------------------------------------
        | Parent
        |--------------------------------------------------------------------------
        */

        $parent = ParentModel::whereHas(
            'students',
            function ($query) use ($enrollment) {
                $query->where(
                    'students.id',
                    $enrollment->student_id
                );
            }
        )->first();

        /*
        |--------------------------------------------------------------------------
        | Attendance Statistics
        |--------------------------------------------------------------------------
        */

        $daysPresent = $attendance
            ->where('status', 'Present')
            ->count();

        $daysAbsent = $attendance
            ->where('status', 'Absent')
            ->count();

        $daysLate = $attendance
            ->where('status', 'Late')
            ->count();

        $daysExcused = $attendance
            ->where('status', 'Excused')
            ->count();

        $daysOpened = $attendance->count();

        $attendancePercentage = $daysOpened > 0
            ? round(($daysPresent / $daysOpened) * 100, 2)
            : 0;

        return [

            /*
            |--------------------------------------------------------------------------
            | Student
            |--------------------------------------------------------------------------
            */

            'student' => $enrollment,

            /*
            |--------------------------------------------------------------------------
            | Parent
            |--------------------------------------------------------------------------
            */

            'parent' => $parent,

            /*
            |--------------------------------------------------------------------------
            | Academic Summary
            |--------------------------------------------------------------------------
            */

            'summary' => $summary,

'subject_results' => \App\Models\Result::with([
    'subject',
    'components.assessmentStructure'
])
->where(
    'student_enrollment_id',
    $enrollment->id
)
->where(
    'academic_session_id',
    $academicSessionId
)
->where(
    'term_id',
    $termId
)
->orderBy('subject_id')
->get(),

            /*
            |--------------------------------------------------------------------------
            | Attendance Summary
            |--------------------------------------------------------------------------
            */

            'attendance' => [

                'days_present' => $daysPresent,

                'days_absent' => $daysAbsent,

                'days_late' => $daysLate,

                'days_excused' => $daysExcused,

                'days_opened' => $daysOpened,

                'attendance_percentage' => $attendancePercentage,
            ],

            /*
            |--------------------------------------------------------------------------
            | Generated Date
            |--------------------------------------------------------------------------
            */

            'generated_at' => now(),
        ];
    }
}
