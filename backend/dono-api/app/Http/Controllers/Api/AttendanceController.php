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
use App\Services\ActivityLogService;
use App\Services\AttendanceService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService,
        protected CurrentContextService $context
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;

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
            'attendance_date' => 'nullable|date',
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');
        $this->assertTeachingScope($request, (int) $schoolId, (int) $request->class_id, $request->stream_id ? (int) $request->stream_id : null, (int) $request->academic_session_id, (int) $request->term_id);

        $query = StudentEnrollment::with(['student', 'class', 'stream'])
            ->where('school_id', $schoolId)
            ->where('academic_session_id', $request->academic_session_id)
            ->where('term_id', $request->term_id)
            ->where('class_id', $request->class_id)
            ->where('status', 'Active');

        if ($request->filled('stream_id')) {
            $query->where('stream_id', $request->stream_id);
        }

        $enrollments = $query->orderBy('id')->get();
        if ($request->filled('attendance_date') && $enrollments->isNotEmpty()) {
            $attendanceByEnrollment = Attendance::query()
                ->where('school_id', $schoolId)
                ->where('academic_session_id', $request->academic_session_id)
                ->where('term_id', $request->term_id)
                ->where('attendance_date', $request->attendance_date)
                ->whereIn('student_enrollment_id', $enrollments->pluck('id'))
                ->get()
                ->keyBy('student_enrollment_id');

            $enrollments->each(function (StudentEnrollment $enrollment) use ($attendanceByEnrollment) {
                $attendance = $attendanceByEnrollment->get($enrollment->id);
                $enrollment->setAttribute('attendance_id', $attendance?->id);
                $enrollment->setAttribute('attendance_status', $attendance?->status);
                $enrollment->setAttribute('attendance_remarks', $attendance?->remarks);
                $enrollment->setAttribute('attendance_updated_at', $attendance?->updated_at?->toISOString());
            });
        }

        return StudentEnrollmentResource::collection($enrollments);
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
            'records.*.client_changed_at' => 'nullable|date',
            'correction_reason' => 'nullable|string|max:1000',
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'No active school context found.');

        $enrollmentIds = collect($request->records)->pluck('student_enrollment_id')->unique()->values();
        $classIds = StudentEnrollment::where('school_id', $schoolId)
            ->where('academic_session_id', $request->academic_session_id)
            ->where('term_id', $request->term_id)
            ->where('status', 'Active')
            ->whereIn('id', $enrollmentIds)
            ->pluck('class_id')
            ->unique();
        abort_unless($classIds->count() === 1 && $classIds->first(), 422, 'Attendance records must belong to one active school class.');
        $this->assertTeachingScope($request, (int) $schoolId, (int) $classIds->first(), null, (int) $request->academic_session_id, (int) $request->term_id);

        $conflicts = DB::transaction(function () use ($schoolId, $request) {
            $conflicts = [];
            foreach ($request->records as $record) {
                if (empty($record['client_changed_at'])) {
                    continue;
                }
                $existing = Attendance::query()
                    ->where('school_id', $schoolId)
                    ->where('student_enrollment_id', $record['student_enrollment_id'])
                    ->where('attendance_date', $request->attendance_date)
                    ->lockForUpdate()
                    ->first();
                if ($existing && $existing->updated_at && Carbon::parse($record['client_changed_at'])->lt($existing->updated_at)) {
                    $conflicts[] = [
                        'student_enrollment_id' => $record['student_enrollment_id'],
                        'server_status' => $existing->status,
                        'server_remarks' => $existing->remarks,
                        'server_updated_at' => $existing->updated_at->toISOString(),
                    ];
                }
            }
            return $conflicts;
        });
        if ($conflicts !== []) {
            return response()->json([
                'conflict' => true,
                'message' => 'One or more attendance rows changed on the server after this register was loaded.',
                'data' => ['conflicts' => $conflicts],
            ], 409);
        }

        $staffId = Staff::where('school_id', $schoolId)->where('user_id', $request->user()->id)->value('id');
        $saved = $this->attendanceService->recordClassAttendance(
            $schoolId,
            $request->academic_session_id,
            $request->term_id,
            $request->attendance_date,
            (int) $staffId,
            $request->records,
            $request->input('correction_reason')
        );
        ActivityLogService::log(
            module: 'attendance',
            action: 'recorded',
            description: 'A class attendance register was recorded or updated.',
            schoolId: $schoolId,
            properties: [
                'academic_session_id' => (int) $request->academic_session_id,
                'term_id' => (int) $request->term_id,
                'class_id' => (int) $classIds->first(),
                'stream_id' => $request->stream_id ? (int) $request->stream_id : null,
                'attendance_date' => $request->attendance_date,
                'count' => $saved->count(),
            ],
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

    public function corrections(Request $request, Attendance $attendance)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId && (int) $attendance->school_id === (int) $schoolId, 404);
        $attendance->loadMissing('studentEnrollment');
        abort_unless($attendance->studentEnrollment, 404);
        $this->assertTeachingScope(
            $request,
            (int) $schoolId,
            (int) $attendance->studentEnrollment->class_id,
            $attendance->studentEnrollment->stream_id ? (int) $attendance->studentEnrollment->stream_id : null,
            (int) $attendance->academic_session_id,
            (int) $attendance->term_id,
        );

        return response()->json([
            'data' => \App\Models\AttendanceCorrection::query()
                ->where('school_id', $schoolId)
                ->where('attendance_id', $attendance->id)
                ->with('editor:id,name')
                ->latest()
                ->paginate(min(max($request->integer('per_page', 25), 1), 100)),
        ]);
    }

    public function show(Request $request, Attendance $attendance)
    {
        return new AttendanceResource(
            $attendance->load(['school', 'studentEnrollment.student', 'academicSession', 'term', 'staff'])
        );
    }
}
