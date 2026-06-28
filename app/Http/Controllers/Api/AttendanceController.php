<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;

class AttendanceController extends Controller
{
    public function index()
    {
        return AttendanceResource::collection(
            Attendance::with([
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])->latest()->paginate(10)
        );
    }

    public function store(StoreAttendanceRequest $request)
    {
        $attendance = Attendance::create($request->validated());

        return (new AttendanceResource(
            $attendance->load([
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function show(Attendance $attendance)
    {
        return new AttendanceResource(
            $attendance->load([
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        );
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance)
    {
        $attendance->update($request->validated());

        return new AttendanceResource(
            $attendance->load([
                'studentEnrollment',
                'academicSession',
                'term',
                'staff',
            ])
        );
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return response()->json([
            'message' => 'Attendance record deleted successfully.',
        ]);
    }
}
