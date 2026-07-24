<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Fee;
use App\Models\PaymentTransaction;
use App\Models\ReportCard;
use App\Models\Result;
use App\Models\Student;

class StudentPerformanceService
{
    /**
     * Build a complete student performance summary.
     */
    public function summary(Student $student): array
    {
        $attendanceRecords = Attendance::where(
            'student_id',
            $student->id
        )->get();

        $attendancePercentage = 0;

        if ($attendanceRecords->count() > 0) {

            $present = $attendanceRecords
                ->where('status', 'present')
                ->count();

            $attendancePercentage = round(
                ($present / $attendanceRecords->count()) * 100,
                2
            );
        }

        $results = Result::where(
            'student_id',
            $student->id
        )->get();

        $averageScore = round(
            $results->avg('score') ?? 0,
            2
        );

        $reportCard = ReportCard::where(
            'student_id',
            $student->id
        )
        ->latest()
        ->first();

        $fees = Fee::where(
            'school_id',
            $student->school_id
        )->sum('amount');

        $payments = PaymentTransaction::where(
            'school_id',
            $student->school_id
        )
        ->where('status', 'successful')
        ->sum('amount');

        $outstandingBalance = max(
            0,
            $fees - $payments
        );
$performance = match (true) {
            $averageScore >= 70 => 'Excellent',
            $averageScore >= 60 => 'Very Good',
            $averageScore >= 50 => 'Good',
            $averageScore >= 40 => 'Fair',
            default => 'Poor',
        };

        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->full_name,
                'admission_number' => $student->admission_number,
            ],

            'attendance_percentage' => $attendancePercentage,

            'average_score' => $averageScore,

            'performance' => $performance,

            'report_card' => $reportCard,

            'total_fees' => $fees,

            'total_paid' => $payments,

            'outstanding_balance' => $outstandingBalance,
        ];
    }
}
