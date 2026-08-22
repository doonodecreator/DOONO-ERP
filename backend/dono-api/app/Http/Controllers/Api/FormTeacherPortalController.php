<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\DisciplineCase;
use App\Models\FormTeacherAssignment;
use App\Models\Staff;
use App\Models\StudentEnrollment;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class FormTeacherPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $user = $request->user();

        $staff = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        if (! $staff) {
            return response()->json(['message' => 'No active staff record found for this school.'], 403);
        }

        $assignment = FormTeacherAssignment::query()
            ->where('school_id', $schoolId)
            ->where('staff_id', $staff->id)
            ->where('is_active', true)
            ->with(['class.division', 'stream'])
            ->latest()
            ->first();

        $recentAssignments = Assignment::query()
            ->where('school_id', $schoolId)
            ->where('teacher_staff_id', $staff->id)
            ->with(['class', 'subject'])
            ->latest('due_date')
            ->take(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'subject' => $item->subject?->name,
                'class' => $item->class?->name,
                'due_date' => $item->due_date?->toDateString(),
            ])
            ->values();

        if (! $assignment) {
            return response()->json([
                'profile' => [
                    'first_name' => $staff->first_name,
                    'last_name' => $staff->last_name,
                    'form_class' => null,
                    'total_students' => 0,
                ],
                'class_students' => [],
                'pending_tasks' => [
                    'behaviour_reports' => 0,
                    'parent_messages' => 0,
                ],
                'recent_behaviour_logs' => [],
                'recent_assignments' => $recentAssignments,
                'message' => 'Your Proprietor has not assigned a form class yet.',
            ]);
        }

        $enrollments = StudentEnrollment::query()
            ->where('school_id', $schoolId)
            ->where('class_id', $assignment->class_id)
            ->where('status', 'Active')
            ->when(
                $assignment->stream_id,
                fn ($query) => $query->where('stream_id', $assignment->stream_id),
            )
            ->with('student')
            ->orderBy('id')
            ->get();

        $enrollmentIds = $enrollments->pluck('id');
        $attendanceByEnrollment = Attendance::query()
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->get()
            ->groupBy('student_enrollment_id');

        $classStudents = $enrollments->map(function (StudentEnrollment $enrollment) use ($attendanceByEnrollment) {
            $attendance = $attendanceByEnrollment->get($enrollment->id, collect());
            $attended = $attendance->whereIn('status', ['Present', 'Late'])->count();
            $total = $attendance->count();
            $rate = $total > 0 ? round(($attended / $total) * 100, 1) : 0;

            return [
                'id' => $enrollment->student_id,
                'enrollment_id' => $enrollment->id,
                'name' => $enrollment->student?->full_name,
                'admission_number' => $enrollment->student?->admission_number,
                'attendance_rate' => $rate,
            ];
        })->values();

        $recentBehaviourLogs = DisciplineCase::query()
            ->where('school_id', $schoolId)
            ->whereIn('student_id', $enrollments->pluck('student_id'))
            ->with('student')
            ->latest('incident_date')
            ->take(5)
            ->get()
            ->map(fn ($case) => [
                'id' => $case->id,
                'student' => $case->student?->full_name,
                'incident' => $case->description,
                'status' => $case->status,
                'date' => $case->incident_date?->toDateString(),
            ])
            ->values();

        $className = $assignment->class?->name;
        $streamName = $assignment->stream?->name;

        return response()->json([
            'profile' => [
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'form_class' => $streamName ? "{$className} / {$streamName}" : $className,
                'total_students' => $classStudents->count(),
            ],
            'assignment' => [
                'class_id' => $assignment->class_id,
                'class_name' => $className,
                'stream_id' => $assignment->stream_id,
                'stream_name' => $streamName,
            ],
            'class_students' => $classStudents,
            'pending_tasks' => [
                'behaviour_reports' => $recentBehaviourLogs->where('status', 'Open')->count(),
                'parent_messages' => 0,
            ],
            'recent_behaviour_logs' => $recentBehaviourLogs,
            'recent_assignments' => $recentAssignments,
        ]);
    }
}
