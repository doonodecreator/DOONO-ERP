<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffAttendanceBulkRequest;
use App\Http\Requests\StoreStaffAttendanceRequest;
use App\Http\Requests\UpdateStaffAttendanceRequest;
use App\Http\Resources\StaffAttendanceResource;
use App\Models\Staff;
use App\Models\StaffAttendance;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\StaffAttendanceService;
use Illuminate\Http\Request;

class StaffAttendanceController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private StaffAttendanceService $attendanceService
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);

        $query = StaffAttendance::with(['staff', 'recorder'])
            ->where('school_id', $schoolId)
            ->when($request->filled('attendance_date'), function ($query) use ($request) {
                $query->whereDate('attendance_date', $request->input('attendance_date'));
            })
            ->when($request->filled('staff_id'), function ($query) use ($request) {
                $query->where('staff_id', $request->integer('staff_id'));
            })
            ->latest('attendance_date')
            ->latest('id');

        return StaffAttendanceResource::collection(
            $query->paginate($this->perPage($request))
        );
    }

    public function roster(Request $request)
    {
        $data = $request->validate([
            'attendance_date' => ['required', 'date'],
        ]);

        $schoolId = $this->currentSchoolId($request);

        $records = StaffAttendance::where('school_id', $schoolId)
            ->whereDate('attendance_date', $data['attendance_date'])
            ->get()
            ->keyBy('staff_id');

        $staff = Staff::where('school_id', $schoolId)
            ->where('employment_status', 'Active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'attendance_date' => $data['attendance_date'],
            'data' => $staff->map(function (Staff $member) use ($records) {
                $record = $records->get($member->id);

                return [
                    'staff_id' => $member->id,
                    'staff_number' => $member->staff_number,
                    'full_name' => $member->full_name,
                    'designation' => $member->designation,
                    'department' => $member->department,
                    'attendance' => $record ? new StaffAttendanceResource($record) : null,
                ];
            })->values(),
        ]);
    }

    public function store(StoreStaffAttendanceRequest $request)
    {
        $schoolId = $this->currentSchoolId($request);
        $data = $request->validated();

        $attendance = StaffAttendance::updateOrCreate(
            [
                'school_id' => $schoolId,
                'staff_id' => $data['staff_id'],
                'attendance_date' => $data['attendance_date'],
            ],
            [
                'status' => $data['status'],
                'check_in_at' => $data['check_in_at'] ?? null,
                'check_out_at' => $data['check_out_at'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'recorded_by' => $request->user()->id,
            ]
        );

        ActivityLogService::log(
            module: 'staff_attendance',
            action: 'recorded',
            description: "Staff attendance recorded for {$attendance->attendance_date->format('Y-m-d')}",
            subject: $attendance,
            schoolId: $schoolId,
        );

        return (new StaffAttendanceResource(
            $attendance->load(['staff', 'recorder'])
        ))->response()->setStatusCode(201);
    }

    public function bulkStore(StoreStaffAttendanceBulkRequest $request)
    {
        $schoolId = $this->currentSchoolId($request);
        $data = $request->validated();

        $attendances = $this->attendanceService->recordDailyAttendance(
            $schoolId,
            $data['attendance_date'],
            $data['records'],
            $request->user()->id
        );

        ActivityLogService::log(
            module: 'staff_attendance',
            action: 'bulk_recorded',
            description: "Staff attendance recorded for {$data['attendance_date']}",
            subject: null,
            schoolId: $schoolId,
        );

        return StaffAttendanceResource::collection($attendances);
    }

    public function show(Request $request, StaffAttendance $staffAttendance)
    {
        $this->ensureAttendanceBelongsToSchool($request, $staffAttendance);

        return new StaffAttendanceResource(
            $staffAttendance->load(['staff', 'recorder'])
        );
    }

    public function update(
        UpdateStaffAttendanceRequest $request,
        StaffAttendance $staffAttendance
    ) {
        $schoolId = $this->currentSchoolId($request);
        $this->ensureAttendanceBelongsToSchool($request, $staffAttendance);

        $staffAttendance->update($request->validated());

        ActivityLogService::log(
            module: 'staff_attendance',
            action: 'updated',
            description: "Staff attendance updated for {$staffAttendance->attendance_date->format('Y-m-d')}",
            subject: $staffAttendance,
            schoolId: $schoolId,
        );

        return new StaffAttendanceResource(
            $staffAttendance->load(['staff', 'recorder'])
        );
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }

    private function ensureAttendanceBelongsToSchool(
        Request $request,
        StaffAttendance $staffAttendance
    ): void {
        abort_unless(
            $staffAttendance->school_id === $this->currentSchoolId($request),
            403
        );
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}
