<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GraduationRecord;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\StudentLifecycleService;
use Illuminate\Http\Request;

class GraduationRecordController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly StudentLifecycleService $lifecycle,
    ) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireActiveSchool($request);

        return response()->json([
            'data' => GraduationRecord::query()
                ->where('school_id', $schoolId)
                ->with(['student', 'academicSession'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireActiveSchool($request);
        $data = $request->validate([
            'student_id' => ['required', 'integer'],
            'academic_session_id' => ['nullable', 'integer'],
            'graduation_date' => ['nullable', 'date'],
            'certificate_number' => ['nullable', 'string', 'max:100'],
            'destination' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:graduated,alumni,pending'],
            'notes' => ['nullable', 'string'],
        ]);

        $record = $this->lifecycle->recordGraduation(
            $data,
            (int) $schoolId,
            (int) $request->user()->id,
        );

        ActivityLogService::log(
            module: 'student_lifecycle',
            action: $data['status'] === 'pending' ? 'graduation_pending' : 'graduated',
            description: $data['status'] === 'pending'
                ? 'Created a pending graduation record without closing the student.'
                : 'Graduated a student and closed the student’s active learning enrollment.',
            subject: $record,
            schoolId: (int) $schoolId,
            properties: ['student_id' => $record->student_id, 'status' => $record->status],
        );

        return response()->json([
            'data' => $record,
            'student' => $record->student,
            'message' => $record->status === 'pending'
                ? 'Pending graduation record saved; the student remains active until graduation is completed.'
                : 'Graduation completed; active enrollments were closed and the student portal learning state is now inactive.',
        ], 201);
    }

    public function update(Request $request, GraduationRecord $graduationRecord)
    {
        $schoolId = $this->requireActiveSchool($request);
        abort_unless((int) $graduationRecord->school_id === (int) $schoolId, 404, 'Graduation record not found.');

        $data = $request->validate([
            'graduation_date' => ['sometimes', 'nullable', 'date'],
            'certificate_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'destination' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:graduated,alumni,pending'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $record = $this->lifecycle->updateGraduation($graduationRecord, $data, (int) $schoolId);
        ActivityLogService::log(
            module: 'student_lifecycle',
            action: 'graduation_updated',
            description: 'Updated graduation or alumni information while preserving lifecycle safeguards.',
            subject: $record,
            schoolId: (int) $schoolId,
        );

        return response()->json(['data' => $record]);
    }

    public function destroy(Request $request, GraduationRecord $graduationRecord)
    {
        $schoolId = $this->requireActiveSchool($request);
        abort_unless((int) $graduationRecord->school_id === (int) $schoolId, 404, 'Graduation record not found.');

        if ($graduationRecord->status !== 'pending') {
            return response()->json([
                'message' => 'Completed graduation records are retained as official history and cannot be deleted.',
            ], 409);
        }

        $graduationRecord->delete();
        ActivityLogService::log(
            module: 'student_lifecycle',
            action: 'pending_graduation_deleted',
            description: 'Deleted a pending graduation record before it became official.',
            subject: $graduationRecord,
            schoolId: (int) $schoolId,
        );

        return response()->json(['message' => 'Pending graduation record deleted successfully.']);
    }

    private function requireActiveSchool(Request $request): int
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 409, 'No active school selected.');

        return (int) $schoolId;
    }
}
