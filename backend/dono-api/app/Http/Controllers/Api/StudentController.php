<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurrentContextService;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {}

    private function currentContextSchoolId(Request $request): ?int
    {
        return $this->context->currentSchool($request->user())?->id;
    }
    public function index(Request $request)
    {
        $query = Student::with([
            'school',
            'division',
            'class',
            'stream',
            'academicSession',
        ]);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where(
                'school_id',
                $this->currentContextSchoolId($request)
            );
        }

        return StudentResource::collection(
            $query->orderBy('admission_number')->paginate(10)
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

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $this->currentContextSchoolId($request);
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
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $student->school_id !== $this->currentContextSchoolId($request)
        ) {
            abort(403, 'Unauthorized.');
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
