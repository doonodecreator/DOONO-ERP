<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\ClassModel;
use App\Models\Staff;
use App\Models\Stream;
use App\Models\Student;
use App\Models\Subject;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AssignmentController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $query = Assignment::where('school_id', $schoolId)
            ->with(['teacher', 'class', 'stream', 'subject'])
            ->withCount(['submissions', 'submissions as submitted_count' => fn ($q) => $q->whereIn('status', ['Submitted', 'Reviewed', 'Returned'])])
            ->when($request->filled('class_id'), fn ($q) => $q->where('class_id', $request->integer('class_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest('due_date')->latest();

        return response()->json($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'stream_id' => ['nullable', 'exists:streams,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['required', 'in:Draft,Published,Closed'],
        ]);

        $this->assertAcademicOwnership($schoolId, $data);
        $staff = Staff::where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();
        $assignment = Assignment::create([...$data, 'school_id' => $schoolId, 'teacher_staff_id' => $staff?->id, 'created_by' => $request->user()->id]);
        ActivityLogService::log(module: 'assignments', action: 'created', description: "Assignment '{$assignment->title}' was created.", schoolId: $schoolId, properties: ['assignment_id' => $assignment->id, 'status' => $assignment->status]);
        return response()->json(['data' => $this->assignmentPayload($assignment)], 201);
    }

    public function update(Request $request, Assignment $assignment)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        $data = $request->validate([
            'class_id' => ['sometimes', 'exists:classes,id'],
            'stream_id' => ['nullable', 'exists:streams,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:Draft,Published,Closed'],
        ]);
        $this->assertAcademicOwnership($schoolId, [...$assignment->only(['class_id', 'stream_id', 'subject_id']), ...$data]);
        $assignment->update($data);
        ActivityLogService::log(module: 'assignments', action: 'updated', description: "Assignment '{$assignment->title}' was updated.", schoolId: $schoolId, properties: ['assignment_id' => $assignment->id, 'changes' => array_keys($data)]);
        return response()->json(['data' => $this->assignmentPayload($assignment->fresh())]);
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        $assignment->delete();
        ActivityLogService::log(module: 'assignments', action: 'deleted', description: 'An assignment was deleted.', schoolId: $schoolId, properties: ['assignment_id' => $assignment->id]);
        return response()->json(['message' => 'Assignment deleted.']);
    }

    public function studentAssignments(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->studentForUser($request, $schoolId);
        $classId = $student->class_id ?: $student->enrollments()->where('status', 'Active')->latest('id')->value('class_id');
        $streamId = $student->stream_id ?: $student->enrollments()->where('status', 'Active')->latest('id')->value('stream_id');
        abort_unless($classId, 404, 'Your current class has not been configured.');

        $assignments = Assignment::where('school_id', $schoolId)
            ->where('class_id', $classId)
            ->where('status', 'Published')
            ->where(function ($query) use ($streamId) {
                $query->whereNull('stream_id');
                if ($streamId) $query->orWhere('stream_id', $streamId);
            })
            ->with(['class', 'stream', 'subject', 'submissions' => fn ($q) => $q->where('student_id', $student->id)])
            ->latest('due_date')->latest()
            ->get();

        return response()->json(['data' => $assignments]);
    }

    public function studentSubmit(Request $request, Assignment $assignment)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        abort_unless($assignment->status === 'Published', 422, 'This assignment is not currently open for submission.');
        $student = $this->studentForUser($request, $schoolId);
        $this->assertStudentTarget($assignment, $student);
        $data = $request->validate([
            'answer_text' => ['required', 'string', 'max:50000'],
            'attachment_url' => ['nullable', 'url', 'max:2048'],
        ]);

        $existing = AssignmentSubmission::where('assignment_id', $assignment->id)->where('student_id', $student->id)->first();
        abort_if($existing && $existing->status === 'Reviewed', 422, 'This submission has already been reviewed and cannot be replaced.');
        $isLate = $assignment->due_date && Carbon::now()->startOfDay()->gt(Carbon::parse($assignment->due_date)->startOfDay());
        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'student_id' => $student->id],
            [
                'school_id' => $schoolId,
                'submitted_by' => $request->user()->id,
                'answer_text' => $data['answer_text'],
                'attachment_url' => $data['attachment_url'] ?? null,
                'status' => 'Submitted',
                'is_late' => $isLate,
                'submitted_at' => now(),
                'feedback' => null,
                'grade' => null,
                'graded_by' => null,
                'graded_at' => null,
            ]
        );

        ActivityLogService::log(module: 'assignments', action: 'submitted', description: "A student submitted assignment '{$assignment->title}'.", schoolId: $schoolId, properties: ['assignment_id' => $assignment->id, 'student_id' => $student->id, 'is_late' => $isLate]);
        return response()->json(['data' => $submission->load('assignment:id,title,due_date'), 'message' => $isLate ? 'Assignment submitted and marked late.' : 'Assignment submitted successfully.']);
    }

    public function mySubmission(Request $request, Assignment $assignment)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        $student = $this->studentForUser($request, $schoolId);
        $this->assertStudentTarget($assignment, $student);
        return response()->json(['data' => AssignmentSubmission::where('assignment_id', $assignment->id)->where('student_id', $student->id)->first()]);
    }

    public function submissions(Request $request, Assignment $assignment)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        $submissions = $assignment->submissions()->where('school_id', $schoolId)->with(['student:id,first_name,middle_name,last_name,admission_number', 'grader:id,name'])->latest('submitted_at')->paginate(min(max($request->integer('per_page', 50), 1), 200));
        return response()->json($submissions);
    }

    public function teacherReview(Request $request, Assignment $assignment, AssignmentSubmission $submission)
    {
        $schoolId = $this->ensureSchool($request, $assignment);
        abort_unless((int) $submission->assignment_id === (int) $assignment->id && (int) $submission->school_id === $schoolId, 404);
        $data = $request->validate([
            'status' => ['required', 'in:Reviewed,Returned'],
            'grade' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:10000'],
        ]);
        $submission->update([...$data, 'graded_by' => $request->user()->id, 'graded_at' => now()]);
        ActivityLogService::log(module: 'assignments', action: 'reviewed', description: "A teacher reviewed an assignment submission.", schoolId: $schoolId, properties: ['assignment_id' => $assignment->id, 'submission_id' => $submission->id, 'status' => $data['status']]);
        return response()->json(['data' => $submission->fresh()->load(['student:id,first_name,middle_name,last_name,admission_number', 'grader:id,name']), 'message' => 'Submission review saved.']);
    }

    private function assertAcademicOwnership(int $schoolId, array $data): void
    {
        abort_unless(ClassModel::whereKey($data['class_id'] ?? 0)->whereHas('division', fn ($q) => $q->where('school_id', $schoolId))->exists(), 403, 'The selected class does not belong to this school.');
        if (!empty($data['subject_id'])) abort_unless(Subject::whereKey($data['subject_id'])->where('school_id', $schoolId)->exists(), 403, 'The selected subject does not belong to this school.');
        if (!empty($data['stream_id'])) abort_unless(Stream::whereKey($data['stream_id'])->where('class_id', $data['class_id'])->exists(), 403, 'The selected stream does not belong to the selected class.');
    }

    private function studentForUser(Request $request, int $schoolId): Student
    {
        return Student::where('school_id', $schoolId)->where('user_id', $request->user()->id)->firstOrFail();
    }

    private function assertStudentTarget(Assignment $assignment, Student $student): void
    {
        $classId = $student->class_id ?: $student->enrollments()->where('status', 'Active')->latest('id')->value('class_id');
        $streamId = $student->stream_id ?: $student->enrollments()->where('status', 'Active')->latest('id')->value('stream_id');
        abort_unless((int) $assignment->class_id === (int) $classId, 403, 'This assignment is not assigned to your class.');
        abort_unless($assignment->stream_id === null || (int) $assignment->stream_id === (int) $streamId, 403, 'This assignment is not assigned to your stream.');
    }

    private function assignmentPayload(Assignment $assignment): Assignment
    {
        return $assignment->load(['teacher', 'class', 'stream', 'subject'])->loadCount(['submissions', 'submissions as submitted_count' => fn ($q) => $q->whereIn('status', ['Submitted', 'Reviewed', 'Returned'])]);
    }

    private function ensureSchool(Request $request, Assignment $assignment): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assignment->school_id === $schoolId, 403);
        return $schoolId;
    }
}
