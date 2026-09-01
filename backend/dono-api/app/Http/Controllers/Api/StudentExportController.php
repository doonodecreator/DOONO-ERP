<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\CurrentContextService;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class StudentExportController extends Controller
{
    public function __construct(private CurrentContextService $context) {}

    public function csv(Request $request)
    {
        $school = $this->context->currentSchool($request->user());
        abort_unless($school, 409, 'Select an active school before exporting student records.');
        abort_unless($request->user()->hasPermission('view_students', (int) $school->id), 403);

        ActivityLogService::log(
            module: 'students',
            action: 'exported',
            description: 'A school-scoped student CSV export was generated.',
            schoolId: $school->id,
            properties: ['format' => 'csv'],
        );

        $filename = 'students-' . preg_replace('/[^a-z0-9]+/i', '-', $school->name) . '-' . now()->format('Ymd-His') . '.csv';
        return response()->streamDownload(function () use ($school) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Admission number', 'First name', 'Middle name', 'Last name', 'Class', 'Stream', 'Status']);
            Student::query()
                ->where('school_id', $school->id)
                ->with(['class:id,name', 'stream:id,name'])
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->chunkById(500, function ($students) use ($handle) {
                    foreach ($students as $student) {
                        fputcsv($handle, [
                            $student->admission_number,
                            $student->first_name,
                            $student->middle_name,
                            $student->last_name,
                            $student->class?->name,
                            $student->stream?->name,
                            $student->status,
                        ]);
                    }
                });
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
