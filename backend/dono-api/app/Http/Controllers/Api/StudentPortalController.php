<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Student;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function dashboard(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);

        $student = Student::with(['school', 'class', 'stream'])
            ->where('school_id', $schoolId)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_unless(
            $student,
            403,
            'No student portal profile is linked to this account.'
        );

        $attendance = Attendance::where('school_id', $schoolId)
            ->whereHas('studentEnrollment', function ($query) use ($schoolId, $student) {
                $query->where('school_id', $schoolId)
                    ->where('student_id', $student->id);
            })
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'student_profile' => $student,
            'upcoming_assignments' => [],
            'recent_results' => [],
            'attendance_summary' => [
                'present' => (int) ($attendance['Present'] ?? 0),
                'absent' => (int) ($attendance['Absent'] ?? 0),
                'late' => (int) ($attendance['Late'] ?? 0),
                'excused' => (int) ($attendance['Excused'] ?? 0),
            ],
        ]);
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }
}
