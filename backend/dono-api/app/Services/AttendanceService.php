<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\StudentEnrollment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    /**
     * Record daily class attendance in a single batch transaction.
     *
     * @param array $records List of ['student_enrollment_id' => int, 'status' => string, 'remarks' => ?string]
     */
    public function recordClassAttendance(
        int $schoolId,
        int $sessionId,
        int $termId,
        string $date,
        int $recordedByStaffId,
        array $records
    ): Collection {
        return DB::transaction(function () use ($schoolId, $sessionId, $termId, $date, $recordedByStaffId, $records) {
            $saved = collect();

            foreach ($records as $item) {
                $attendance = Attendance::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'student_enrollment_id' => $item['student_enrollment_id'],
                        'academic_session_id' => $sessionId,
                        'term_id' => $termId,
                        'attendance_date' => $date,
                    ],
                    [
                        'status' => $item['status'], // Present, Absent, Late, Excused
                        'remarks' => $item['remarks'] ?? null,
                        'staff_id' => $recordedByStaffId,
                    ]
                );

                $saved->push($attendance);
            }

            return $saved;
        });
    }

    /**
     * Get attendance summary for a student enrollment.
     */
    public function getStudentSummary(
        int $studentEnrollmentId,
        int $sessionId,
        int $termId
    ): array {
        $records = Attendance::where('student_enrollment_id', $studentEnrollmentId)
            ->where('academic_session_id', $sessionId)
            ->where('term_id', $termId)
            ->get();

        $daysOpened = $records->count();
        $daysPresent = $records->where('status', 'Present')->count();
        $daysAbsent = $records->where('status', 'Absent')->count();
        $daysLate = $records->where('status', 'Late')->count();
        $daysExcused = $records->where('status', 'Excused')->count();

        $percentage = $daysOpened > 0
            ? round(($daysPresent / $daysOpened) * 100, 2)
            : 0.00;

        return [
            'days_opened' => $daysOpened,
            'days_present' => $daysPresent,
            'days_absent' => $daysAbsent,
            'days_late' => $daysLate,
            'days_excused' => $daysExcused,
            'attendance_percentage' => $percentage,
        ];
    }
}
