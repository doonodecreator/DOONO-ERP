<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with([
            'school',
            'division',
            'class',
            'stream',
            'academicSession',
        ]);

        if (! $request->user()->isSuperAdmin()) {
            $query->where('school_id', $request->user()->currentSchoolId());
        }

        return StudentResource::collection(
            $query->orderBy('admission_number')->paginate(10)
        );
    }

    public function store(StoreStudentRequest $request)
    {
        $data = $request->validated();

        if (! $request->user()->isSuperAdmin()) {
            $data['school_id'] = $request->user()->currentSchoolId();
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
            ! $request->user()->isSuperAdmin()
            && $student->school_id != $request->user()->currentSchoolId()
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

    public function update(UpdateStudentRequest $request, Student $student)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $student->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $student->update($request->validated());

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

    public function destroy(Request $request, Student $student)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $student->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully.'
        ]);
    }
}
