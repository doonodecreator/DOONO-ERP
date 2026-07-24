<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Fee;
use App\Models\ParentModel;
use App\Models\PaymentTransaction;
use App\Models\ReportCard;
use App\Models\Result;
use App\Services\StudentPerformanceService;
use Illuminate\Http\JsonResponse;

class ParentDashboardController extends Controller
{
    protected StudentPerformanceService $performanceService;

    public function __construct(
        StudentPerformanceService $performanceService
    ) {
        $this->performanceService = $performanceService;
    }

    /**
     * Parent dashboard summary.
     */
    public function index(ParentModel $parent): JsonResponse
    {
        $enrollmentIds = $parent->students()
            ->pluck('student_enrollments.id');

        $students = $parent->students()->get();

        $studentPerformance = $students
            ->map(function ($student) {
                return $this->performanceService
                    ->summary($student);
            });

        $attendance = Attendance::latest()
            ->take(10)
            ->get();

        $results = Result::whereIn(
            'student_enrollment_id',
            $enrollmentIds
        )
        ->where('is_published', true)
        ->latest()
        ->take(10)
        ->get();

        $reportCards = ReportCard::whereIn(
            'student_enrollment_id',
            $enrollmentIds
        )
        ->where('is_published', true)
        ->latest()
        ->take(10)
        ->get();

        $fees = Fee::where(
            'school_id',
            $parent->school_id
        )
        ->latest()
        ->get();

        $payments = PaymentTransaction::where(
            'school_id',
            $parent->school_id
        )
        ->where('status', 'successful')
        ->latest()
        ->take(10)
        ->get();

        return response()->json([
            'success' => true,

            'parent' => [
                'id' => $parent->id,
                'name' => $parent->full_name,
                'email' => $parent->email,
            ],

            'summary' => [
                'total_students' => $students->count(),
                'total_results' => $results->count(),
                'total_report_cards' => $reportCards->count(),
                'total_fees' => $fees->count(),
                'total_payments' => $payments->count(),
            ],

            'students' => $studentPerformance,

            'recent_attendance' => $attendance,

            'recent_results' => $results,

            'recent_report_cards' => $reportCards,

            'fees' => $fees,

            'recent_payments' => $payments,
        ]);
    }
}
