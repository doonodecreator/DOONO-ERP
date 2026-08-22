<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\Attendance;
use App\Models\FormTeacherAssignment;
use App\Models\Staff;
use App\Models\StudentEnrollment;
use App\Models\Timetable;
use App\Services\AttendanceService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService,
        protected CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        $query = Attendance::with([
            'school',
            'studentEnrollment.student',
            'academicSession',
            'term',
            'staff',
        ]);

        if ($schoolId) {
            $query->where('school_id', $schoolId);
        }

        return AttendanceResource::collection(
            $query->latest()->paginate(15)
        );
    }

    public function classList(Request $request)
    {
        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term_id' => 'required|exists:terms,id',
            'class_id' => 'required|exists:classes,id',
            'stream_id' => 'nullable|exists:streams,id',
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');
        $this->assertTeachingScope($request, (int) $schoolId, (int) $request->class_id, $request->stream_id ? (int) $request->stream_id : null, (int) $request->academic_session_id, (int) $request->term_id);

        $query = StudentEnrollment::with(['student', 'class', 'stream'])
            ->where('school_id', $schoolId)
            ->where('academic_session_id', $request->academic_session_id)
            ->where('term_id', $request->term_id)
            ->where('class_id', $request->class_id);

        if ($request->filled('stream_id')) {
            $query->where('stream_id', $request->stream_id);
        }

        return StudentEnrollmentResource::collection($query->orderBy('id')->get());
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'term_id' => 'required|exists:terms,id',
            'attendance_date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.student_enrollment_id' => 'required|exists:student_enrollments,id',
            'records.*.status' => 'required|string|in:Present,Absent,Late,Excused',
            'records.*.remarks' => 'nullable|string|max:255',
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');

        $enrollmentIds = collect($request->records)->pluck('student_enrollment_id')->unique()->values();
        $classIds = StudentEnrollment::where('school_id', $schoolId)
            ->where('academic_session_id', $request->academic_session_id)
            ->where('term_id', $request->term_id)
            ->whereIn('id', $enrollmentIds)
            ->pluck('class_id')
            ->unique();
        abort_unless($classIds->count() === 1 && $classIds->first(), 422, 'Attendance records must belong to one active school class.');
        $this->assertTeachingScope($request, (int) $schoolId, (int) $classIds->first(), null, (int) $request->academic_session_id, (int) $request->term_id);

        $saved = $this->attendanceService->recordClassAttendance(
            $schoolId,
            $request->academic_session_id,
            $request->term_id,
            $request->attendance_date,
            $request->user()->id,
            $request->records
        );

        return response()->json([
            'success' => true,
            'message' => 'Bulk attendance updated successfully.',
            'count' => $saved->count(),
        ], 200);
    }

    private function assertTeachingScope(Request $request, int $schoolId, int $classId, ?int $streamId, int $sessionId, int $termId): void
    {
        $user = $request->user();
        if (! $user->hasRole('teacher', $schoolId) && ! $user->hasRole('form_teacher', $schoolId)) {
            return;
        }

        $staffId = Staff::where('school_id', $schoolId)->where('user_id', $user->id)->value('id');
        abort_unless($staffId, 403, 'No active teaching staff record is linked to this account.');

        if ($user->hasRole('teacher', $schoolId)) {
            $assigned = Timetable::where('school_id', $schoolId)
                ->where('staff_id', $staffId)
                ->where('class_id', $classId)
                ->when($streamId, fn ($query) => $query->where('stream_id', $streamId))
                ->where('academic_session_id', $sessionId)
                ->where('term_id', $termId)
                ->where('is_active', true)
                ->exists();
            abort_unless($assigned, 403, 'You may only manage attendance for your assigned timetable class.');
            return;
        }

        $assigned = FormTeacherAssignment::where('school_id', $schoolId)
            ->where('staff_id', $staffId)
            ->where('class_id', $classId)
            ->when($streamId, fn ($query) => $query->where('stream_id', $streamId))
            ->where('is_active', true)
            ->exists();
        abort_unless($assigned, 403, 'You may only manage attendance for your assigned form class.');
    }

    public function show(Request $request, Attendance $attendance)
    {
        return new AttendanceResource(
            $attendance->load(['school', 'studentEnrollment.student', 'academicSession', 'term', 'staff'])
        );
    }
}
