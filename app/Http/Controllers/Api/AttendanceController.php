<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
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

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return AttendanceResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreAttendanceRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
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
            ! $request->user()->isSuperAdmin()
            && $attendance->school_id != $request->user()->currentSchoolId()
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
            ! $request->user()->isSuperAdmin()
            && $attendance->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
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
            ! $request->user()->isSuperAdmin()
            && $attendance->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record deleted successfully.'
        ]);
    }
}
