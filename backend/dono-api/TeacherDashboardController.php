<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Result;
use App\Models\Student;
use App\Models\Timetable;
use App\Models\User;
use App\Services\StudentPerformanceService;
use Illuminate\Http\JsonResponse;

class TeacherDashboardController extends Controller
{
    protected StudentPerformanceService $performanceService;

    public function __construct(
        StudentPerformanceService $performanceService
    ) {
        $this->performanceService = $performanceService;
    }

    /**
     * Teacher dashboard.
     */
    public function index(User $teacher): JsonResponse
    {
        $students = Student::where(
            'school_id',
            $teacher->school_id
        )->get();

        $studentPerformance = $students
            ->map(function ($student) {

                return $this->performanceService
                    ->summary($student);

            });

        $attendanceToday = Attendance::whereDate(
            'created_at',
            today()
        )->count();

        $pendingResults = Result::whereNull(
            'published_at'
        )->count();

        $timetable = Timetable::where(
            'school_id',
            $teacher->school_id
        )
        ->latest()
        ->get();
return response()->json([
            'success' => true,

            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
            ],

            'summary' => [
                'total_students' => $students->count(),
                'attendance_today' => $attendanceToday,
                'pending_results' => $pendingResults,
                'total_classes' => $timetable->count(),
            ],

            /*
            |--------------------------------------------------------------------------
            | Student Performance
            |--------------------------------------------------------------------------
            */

            'students' => $studentPerformance,

            /*
            |--------------------------------------------------------------------------
            | Today's Statistics
            |--------------------------------------------------------------------------
            */

            'attendance_today_count' => $attendanceToday,

            'pending_result_uploads' => $pendingResults,

            /*
            |--------------------------------------------------------------------------
            | Timetable
            |--------------------------------------------------------------------------
            */

            'timetable' => $timetable,
        ]);
    }
}
