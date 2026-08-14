<?php

namespace App\Services;

use App\Models\StaffAttendance;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StaffAttendanceService
{
    public function recordDailyAttendance(
        int $schoolId,
        string $attendanceDate,
        array $records,
        int $recordedBy
    ): Collection {
        return DB::transaction(function () use (
            $schoolId,
            $attendanceDate,
            $records,
            $recordedBy
        ) {
            $attendanceIds = [];

            foreach ($records as $record) {
                $attendance = StaffAttendance::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'staff_id' => $record['staff_id'],
                        'attendance_date' => $attendanceDate,
                    ],
                    [
                        'status' => $record['status'],
                        'check_in_at' => $record['check_in_at'] ?? null,
                        'check_out_at' => $record['check_out_at'] ?? null,
                        'remarks' => $record['remarks'] ?? null,
                        'recorded_by' => $recordedBy,
                    ]
                );

                $attendanceIds[] = $attendance->id;
            }

            return StaffAttendance::with(['staff', 'recorder'])
                ->whereIn('id', $attendanceIds)
                ->orderBy('staff_id')
                ->get();
        });
    }
}
