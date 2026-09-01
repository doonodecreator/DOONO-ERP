<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class StaffExportController extends Controller
{
    public function csv(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($request->user()->hasPermission('view_staff', $schoolId), 403);

        ActivityLogService::log(
            module: 'staff',
            action: 'exported',
            description: 'A school-scoped staff CSV export was generated.',
            schoolId: $schoolId,
            properties: ['format' => 'csv'],
        );

        $filename = 'staff-' . now()->format('Ymd-His') . '.csv';
        return response()->streamDownload(function () use ($schoolId): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Staff number', 'First name', 'Middle name', 'Last name', 'Email', 'Phone', 'Designation', 'Department', 'Employment status']);
            Staff::query()
                ->where('school_id', $schoolId)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->chunkById(500, function ($staffMembers) use ($handle): void {
                    foreach ($staffMembers as $staff) {
                        fputcsv($handle, [
                            $staff->staff_number,
                            $staff->first_name,
                            $staff->middle_name,
                            $staff->last_name,
                            $staff->email,
                            $staff->phone,
                            $staff->designation,
                            $staff->department,
                            $staff->employment_status,
                        ]);
                    }
                });
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
