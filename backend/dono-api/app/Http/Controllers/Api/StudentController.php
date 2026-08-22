<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\FormTeacherAssignment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Timetable;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly \App\Services\MediaStorageService $media,
        private readonly \App\Services\SubscriptionQuotaService $quotas,
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;
    }
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

        $schoolId = $this->currentContextSchoolId($request);
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
                $this->currentContextSchoolId($request)
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
        $schoolId = $this->currentContextSchoolId($request);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $schoolId;
        }

        if ($schoolId) {
            $this->quotas->assertCanAddStudent((int) $schoolId);
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $this->media->storeImage($request->file('photo'), 'schools/' . $schoolId . '/students');
        }

        $student = Student::create($data);

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

    public function show(Request $request, Student $student)
    {
        $schoolId = $this->currentContextSchoolId($request);
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
            $student->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

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
            $student->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.',
        ]);
    }
}
