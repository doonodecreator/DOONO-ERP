<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\Attendance;
use App\Models\StudentEnrollment;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceService $attendanceService
    ) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

        $query = Attendance::with([
            'school',
            'studentEnrollment',
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

        $schoolId = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

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

        $schoolId = $request->attributes->get('current_school_id') ?? $request->user()->school_id;

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

    public function show(Request $request, Attendance $attendance)
    {
        return new AttendanceResource(
            $attendance->load(['school', 'studentEnrollment', 'academicSession', 'term', 'staff'])
        );
    }
}
