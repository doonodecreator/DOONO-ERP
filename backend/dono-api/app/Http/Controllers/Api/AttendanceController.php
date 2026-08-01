<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentEnrollmentResource;
use App\Models\Attendance;
use App\Models\StudentEnrollment;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with([
            'school',
            'studentEnrollment',
            'academicSession',
            'term',
            'staff',
        ]);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return AttendanceResource::collection(
            $query->latest()->paginate(10)
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

        $query = StudentEnrollment::with([
            'student',
            'class',
            'stream',
        ])
        ->where('academic_session_id', $request->academic_session_id)
        ->where('term_id', $request->term_id)
        ->where('class_id', $request->class_id);

        if ($request->filled('stream_id')) {
            $query->where('stream_id', $request->stream_id);
        }

        return StudentEnrollmentResource::collection(
            $query->orderBy('id')->get()
        );
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $request->user()->currentSchoolId();
        }

        $attendance = Attendance::create($data);

        return (new AttendanceResource(
            $attendance->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, Attendance $attendance)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $attendance->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        return new AttendanceResource(
            $attendance->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        );
    }

    public function update(
        UpdateAttendanceRequest $request,
        Attendance $attendance
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $attendance->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            unset($data['school_id']);
        }

        $attendance->update($data);

        return new AttendanceResource(
            $attendance->load([
                'school',
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        );
    }

    public function destroy(
        Request $request,
        Attendance $attendance
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $attendance->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record deleted successfully.',
        ]);
    }
}
