<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\FormTeacherAssignment;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\StudentEnrollment;
use App\Models\StudentFee;
use App\Models\StudentResultSummary;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Timetable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\StudentAdmissionNumberService;

class StudentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly \App\Services\MediaStorageService $media,
        private readonly \App\Services\SubscriptionQuotaService $quotas,
        private readonly StudentAdmissionNumberService $admissionNumbers,
    ) {}


    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Student::with([
            'school',
            'division',
            'class',
            'stream',
            'academicSession',
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where('school_id', $schoolId);
            $assignedClassIds = $this->assignedClassIds($request, $schoolId);
            if ($assignedClassIds !== null) {
                $query->whereIn('class_id', $assignedClassIds);
            }
        }

        $search = trim((string) ($validated['search'] ?? ''));

        if ($search !== '') {
            $query->where(function ($studentQuery) use ($search) {
                $studentQuery
                    ->where('admission_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        return StudentResource::collection(
            $query
                ->orderBy('admission_number')
                ->paginate($validated['per_page'] ?? 10)
        );
    }

    /**
     * Students for Result Entry
     */
    public function resultEntryStudents(Request $request)
    {
        $request->validate([
            'class_id' => ['required', 'integer'],
        ]);

        $students = Student::with('class')
            ->where('class_id', $request->class_id);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $students->where(
                'school_id',
                $this->context->currentSchool($request->user())?->id
            );
        }

        $students = $students
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return response()->json([
            'students' => $students,
        ]);
    }

    public function store(StoreStudentRequest $request)
    {
        $data = $request->validated();
        $schoolId = $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 422, 'A school context is required to register a student.');

        $data = array_diff_key($data, ['admission_number' => true, 'school_id' => true]);

        if ($request->hasFile('photo')) {
            $data['photo'] = $this->media->storeImage($request->file('photo'), 'schools/' . $schoolId . '/students');
        }

        $student = DB::transaction(function () use ($data, $schoolId) {
            $this->quotas->assertCanAddStudent((int) $schoolId);

            $data['school_id'] = (int) $schoolId;
            $data['admission_number'] = $this->admissionNumbers->allocate((int) $schoolId);

            return Student::create($data);
        });

        return (new StudentResource(
            $student->load([
                'school',
                'division',
                'class',
                'stream',
                'academicSession',
            ])
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function student360(Request $request, Student $student)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        if (! $request->user()->isSuperAdmin()) {
            abort_unless($schoolId && (int) $student->school_id === (int) $schoolId, 403, 'Unauthorized.');
            $assignedClassIds = $this->assignedClassIds($request, $schoolId);
            if ($assignedClassIds !== null) {
                abort_unless(in_array((int) $student->class_id, $assignedClassIds, true), 403, 'You may only view students in your assigned classes.');
            }
        }

        $enrollments = StudentEnrollment::query()
            ->where('student_id', $student->id)
            ->where('school_id', $student->school_id)
            ->with(['academicSession:id,name', 'term:id,name', 'class:id,name', 'stream:id,name'])
            ->latest('id')
            ->get();

        $attendance = Attendance::query()
            ->where('school_id', $student->school_id)
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id))
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $results = StudentResultSummary::query()
            ->where('school_id', $student->school_id)
            ->where('is_published', true)
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id))
            ->with(['academicSession:id,name', 'term:id,name'])
            ->latest('published_at')
            ->limit(8)
            ->get();

        $fees = StudentFee::query()
            ->whereHas('studentEnrollment', fn ($query) => $query->where('student_id', $student->id)->where('school_id', $student->school_id))
            ->with(['feeCategory:id,name', 'academicSession:id,name', 'term:id,name'])
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn ($fee) => [
                'id' => $fee->id,
                'category' => $fee->feeCategory?->name,
                'session' => $fee->academicSession?->name,
                'term' => $fee->term?->name,
                'amount_due' => $fee->amount_due,
                'total_paid' => $fee->total_paid,
                'balance' => $fee->balance,
            ])->values();

        $assignments = Assignment::query()
            ->where('school_id', $student->school_id)
            ->where('class_id', $student->class_id)
            ->where('status', 'Published')
            ->when($student->stream_id, fn ($query) => $query->where(fn ($inner) => $inner->whereNull('stream_id')->orWhere('stream_id', $student->stream_id)))
            ->latest('id')
            ->limit(10)
            ->get(['id', 'title', 'subject_id', 'due_date', 'status']);

        return response()->json([
            'data' => [
                'student' => new StudentResource($student->load(['school', 'division', 'class', 'stream', 'academicSession', 'guardians'])),
                'enrollments' => $enrollments,
                'attendance' => $attendance->map(fn ($total, $status) => ['status' => $status, 'total' => (int) $total])->values(),
                'published_results' => $results,
                'fees' => $fees,
                'recent_assignments' => $assignments,
            ],
        ]);
    }

    public function show(Request $request, Student $student)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            abort_unless((int) $student->school_id === (int) $schoolId, 403, 'Unauthorized.');
            $assignedClassIds = $this->assignedClassIds($request, $schoolId);
            if ($assignedClassIds !== null) {
                abort_unless(in_array((int) $student->class_id, $assignedClassIds, true), 403, 'You may only view students in your assigned classes.');
            }
        }

        return new StudentResource(
            $student->load([
                'school',
                'division',
                'class',
                'stream',
                'academicSession',
            ])
        );
    }

    private function assignedClassIds(Request $request, ?int $schoolId): ?array
    {
        if (! $schoolId) {
            return [];
        }

        $user = $request->user();
        if (! $user->hasRole('teacher', $schoolId) && ! $user->hasRole('form_teacher', $schoolId)) {
            return null;
        }

        $staffId = Staff::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $user->id)
            ->value('id');

        if (! $staffId) {
            return [];
        }

        $query = $user->hasRole('teacher', $schoolId)
            ? Timetable::query()->where('school_id', $schoolId)->where('staff_id', $staffId)->where('entry_type', 'lesson')
            : FormTeacherAssignment::query()->where('school_id', $schoolId)->where('staff_id', $staffId)->where('is_active', true);

        return $query->pluck('class_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    public function update(
        UpdateStudentRequest $request,
        Student $student
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $student->school_id !== $this->context->currentSchool($request->user())?->id
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();
        unset($data['admission_number']);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $student->school_id;
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $this->media->storeImage($request->file('photo'), 'schools/' . $student->school_id . '/students', $student->photo);
        }

        $student->update($data);

        return new StudentResource(
            $student->load([
                'school',
                'division',
                'class',
                'stream',
                'academicSession',
            ])
        );
    }

    public function destroy(
        Request $request,
        Student $student
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $student->school_id !== $this->context->currentSchool($request->user())?->id
        ) {
            abort(403, 'Unauthorized.');
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }
}
