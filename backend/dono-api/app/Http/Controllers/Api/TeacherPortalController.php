<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\AcademicSession;
use App\Models\Staff;
use App\Models\Timetable;
use App\Services\CurrentContextService;

class TeacherPortalController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($user)?->id;

        if (!$schoolId) {
            return response()->json(['message' => 'No active school context found.'], 403);
        }

        $staff = Staff::where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->first();

        if (!$staff) {
            return response()->json(['message' => 'No active staff record found for this school.'], 403);
        }

        $session = AcademicSession::where('school_id', $schoolId)
            ->where('is_current', true)
            ->with('currentTerm')
            ->first();

        $timetableQuery = Timetable::where('school_id', $schoolId)
            ->where('staff_id', $staff->id)
            ->when($session, fn($q) => $q->where('academic_session_id', $session->id))
            ->when($session?->currentTerm, fn($q) => $q->where('term_id', $session->currentTerm->id));

        $myClasses = $timetableQuery->clone()
            ->with(['class', 'stream'])
            ->get()
            ->unique(fn($t) => ($t->class_id ?? 0) . '-' . ($t->stream_id ?? 0))
            ->map(fn($t) => [
                'id' => $t->class_id,
                'name' => trim(($t->class?->name ?? 'Class') . ' ' . ($t->stream?->name ?? '')),
                'student_count' => $t->class?->students()->where('school_id', $schoolId)->count() ?? 0
            ])
            ->values();

        $mySubjects = $timetableQuery->clone()
            ->with(['subject', 'class', 'stream'])
            ->get()
            ->unique(fn($t) => ($t->subject_id ?? 0) . '-' . ($t->class_id ?? 0))
            ->map(fn($t) => [
                'id' => $t->subject_id,
                'name' => $t->subject?->name ?? 'Subject',
                'class' => trim(($t->class?->name ?? 'Class') . ' ' . ($t->stream?->name ?? ''))
            ])
            ->values();

        return response()->json([
            'teacher_profile' => [
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'employee_id' => $staff->staff_number,
                'department' => $staff->department
            ],
            'my_classes' => $myClasses,
            'my_subjects' => $mySubjects,
            'recent_assignments' => [], // Assignment model not yet registered
            'pending_tasks' => [
                'upload_ca' => 0,
                'mark_attendance' => 0
            ],
            'context' => [
                'session' => $session?->name,
                'term' => $session?->currentTerm?->name
            ]
        ]);
    }
}
