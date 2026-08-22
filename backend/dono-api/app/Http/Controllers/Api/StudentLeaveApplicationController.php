<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentLeaveApplication;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentLeaveApplicationController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = StudentLeaveApplication::with(['student:id,first_name,middle_name,last_name', 'requester:id,name', 'reviewer:id,name'])
            ->where('school_id', $schoolId);

        if (!$this->canReview($request)) {
            $query->whereIn('student_id', $this->ownedStudentIds($request, $schoolId));
        }

        return response()->json($query->latest()->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'leave_type' => ['required', 'string', 'max:80'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        abort_unless(in_array((int) $data['student_id'], $this->ownedStudentIds($request, $schoolId), true), 403, 'You can only apply for a linked student.');

        $application = StudentLeaveApplication::create([
            ...$data,
            'school_id' => $schoolId,
            'requested_by' => $request->user()->id,
            'status' => 'Pending',
        ]);

        ActivityLogService::log(module: 'student_leave', action: 'created', description: 'A student leave application was submitted.', subject: $application, schoolId: $schoolId);

        return response()->json(['data' => $application->load(['student:id,first_name,middle_name,last_name', 'requester:id,name'])], 201);
    }

    public function review(Request $request, StudentLeaveApplication $studentLeaveApplication)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless($this->canReview($request), 403);
        abort_unless((int) $studentLeaveApplication->school_id === $schoolId, 404);

        $data = $request->validate([
            'status' => ['required', Rule::in(['Approved', 'Rejected'])],
            'reviewer_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $studentLeaveApplication->update([...$data, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        ActivityLogService::log(module: 'student_leave', action: strtolower($data['status']), description: "Student leave application {$data['status']}.", subject: $studentLeaveApplication, schoolId: $schoolId);

        return response()->json(['data' => $studentLeaveApplication->fresh()->load(['student:id,first_name,middle_name,last_name', 'requester:id,name', 'reviewer:id,name'])]);
    }

    private function ownedStudentIds(Request $request, int $schoolId): array
    {
        $userId = $request->user()->id;
        return Student::where('school_id', $schoolId)
            ->where(function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->orWhereHas('guardians', fn ($guardianQuery) => $guardianQuery->where('user_id', $userId));
            })
            ->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    private function canReview(Request $request): bool
    {
        return collect(['proprietor', 'principal', 'vice_principal_admin'])
            ->contains(fn (string $role) => $request->user()->hasRole($role));
    }
}
