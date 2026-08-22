<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Assignment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Timetable;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class TeacherPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $school = $this->context->currentSchool($user);
        $schoolId = $school?->id;

        if (! $schoolId) {
            return response()->json(['message' => 'No active school context found.'], 403);
        }

        $staff = Staff::where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        if (! $staff) {
            return response()->json(['message' => 'No active staff record found for this school.'], 403);
        }

        $session = AcademicSession::where('school_id', $schoolId)
            ->where('is_current', true)
            ->first()
            ?? AcademicSession::where('school_id', $schoolId)
                ->latest('start_date')
                ->first();

        $currentTerm = $session
            ? ($session->terms()->where('is_current', true)->first()
                ?? $session->terms()->latest('start_date')->first())
            : null;

        $timetableQuery = Timetable::where('school_id', $schoolId)
            ->where('staff_id', $staff->id)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->where('entry_type', 'lesson')->orWhereNull('entry_type');
            })
            ->when($session, fn ($query) => $query->where('academic_session_id', $session->id))
            ->when($currentTerm, fn ($query) => $query->where('term_id', $currentTerm->id));

        $timetable = $timetableQuery->clone()
            ->with(['class', 'stream', 'subject'])
            ->orderByRaw("FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('start_time')
            ->get();

        $myTimetable = $timetable->map(fn (Timetable $slot) => [
            'id' => $slot->id,
            'day_of_week' => $slot->day_of_week,
            'start_time' => $slot->start_time,
            'end_time' => $slot->end_time,
            'subject' => $slot->subject?->name,
            'class' => $slot->class?->name,
            'stream' => $slot->stream?->name,
            'room' => $slot->room,
        ])->values();

        $myClasses = $timetable
            ->unique(fn (Timetable $slot) => ($slot->class_id ?? 0) . '-' . ($slot->stream_id ?? 0))
            ->map(fn (Timetable $slot) => [
                'id' => $slot->class_id,
                'class_id' => $slot->class_id,
                'stream_id' => $slot->stream_id,
                'name' => trim(($slot->class?->name ?? 'Class') . ' ' . ($slot->stream?->name ?? '')),
                'student_count' => $slot->class
                    ? $slot->class->students()->where('school_id', $schoolId)->count()
                    : 0,
            ])->values();

        $mySubjects = $timetable
            ->unique(fn (Timetable $slot) => ($slot->subject_id ?? 0) . '-' . ($slot->class_id ?? 0) . '-' . ($slot->stream_id ?? 0))
            ->map(fn (Timetable $slot) => [
                'id' => $slot->subject_id,
                'subject_id' => $slot->subject_id,
                'class_id' => $slot->class_id,
                'stream_id' => $slot->stream_id,
                'name' => $slot->subject?->name ?? 'Subject',
                'class' => trim(($slot->class?->name ?? 'Class') . ' ' . ($slot->stream?->name ?? '')),
            ])->values();

        $assignedClassIds = $timetable->pluck('class_id')->filter()->unique()->values();
        $assignedStreamIds = $timetable->pluck('stream_id')->filter()->unique()->values();

        $myStudents = Student::where('school_id', $schoolId)
            ->when($assignedClassIds->isNotEmpty(), fn ($query) => $query->whereIn('class_id', $assignedClassIds))
            ->when($assignedClassIds->isEmpty(), fn ($query) => $query->whereRaw('1 = 0'))
            ->with(['class', 'stream'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(100)
            ->get()
            ->filter(function (Student $student) use ($assignedStreamIds) {
                return $assignedStreamIds->isEmpty() || ! $student->stream_id || $assignedStreamIds->contains($student->stream_id);
            })
            ->map(fn (Student $student) => [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'admission_number' => $student->admission_number,
                'class' => $student->class?->name,
                'stream' => $student->stream?->name,
            ])->values();

        $recentAssignments = Assignment::where('school_id', $schoolId)
            ->where('teacher_staff_id', $staff->id)
            ->with(['class', 'stream', 'subject'])
            ->latest('due_date')
            ->take(5)
            ->get()
            ->map(fn (Assignment $assignment) => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'subject' => $assignment->subject?->name,
                'class' => $assignment->class?->name,
                'stream' => $assignment->stream?->name,
                'due_date' => $assignment->due_date?->toDateString(),
                'status' => $assignment->status,
            ])->values();

        return response()->json([
            'teacher_profile' => [
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'employee_id' => $staff->staff_number,
                'department' => $staff->department,
            ],
            'my_classes' => $myClasses,
            'my_subjects' => $mySubjects,
            'my_students' => $myStudents,
            'timetable' => $myTimetable,
            'recent_assignments' => $recentAssignments,
            'pending_tasks' => [
                'upload_ca' => 0,
                'mark_attendance' => 0,
            ],
            'context' => [
                'school' => $school->name,
                'session' => $session?->name,
                'term' => $currentTerm?->name,
            ],
        ]);
    }
}
