<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Result;
use App\Models\Attendance;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($user)?->id;

        $student = Student::where('user_id', $user->id)
            ->when($schoolId, fn($q) => $q->where('school_id', $schoolId))
            ->with(['class', 'stream', 'enrollments'])
            ->first();

        if (!$student) {
            // Fallback for demo or unlinked accounts
            return response()->json([
                'student_profile' => ['first_name' => $user->name, 'last_name' => '', 'admission_number' => 'UNLINKED'],
                'upcoming_assignments' => [],
                'recent_results' => [],
                'attendance_summary' => ['present' => 0, 'absent' => 0]
            ]);
        }

        $enrollmentIds = $student->enrollments()->pluck('id');

        $recentResults = Result::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('is_published', true)
            ->with('subject')
            ->latest('published_at')
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'subject' => $r->subject?->name ?? 'Subject',
                'score' => $r->total_score,
                'grade' => $r->grade ?? '-'
            ]);

        $presentCount = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('status', 'Present')
            ->count();
        $absentCount = Attendance::whereIn('student_enrollment_id', $enrollmentIds)
            ->where('status', 'Absent')
            ->count();

        return response()->json([
            'student_profile' => $student,
            'upcoming_assignments' => [],
            'recent_results' => $recentResults,
            'attendance_summary' => [
                'present' => $presentCount,
                'absent' => $absentCount
            ]
        ]);
    }
}
