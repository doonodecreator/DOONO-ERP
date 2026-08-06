<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubjectRequest;
use App\Http\Requests\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Subject::with([
            'school',
            'division',
            'classes',
        ]);

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return SubjectResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreSubjectRequest $request)
    {
        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $request->user()->currentSchoolId();
        }

        $subject = Subject::create($data);

        return (
            new SubjectResource(
                $subject->load([
                    'school',
                    'division',
                    'classes',
                ])
            )
        )
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, Subject $subject)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $subject->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized access to this subject.');
        }

        return new SubjectResource(
            $subject->load([
                'school',
                'division',
                'classes',
            ])
        );
    }

    public function update(
        UpdateSubjectRequest $request,
        Subject $subject
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $subject->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized access to update this subject.');
        }

        $subject->update(
            $request->validated()
        );

        return new SubjectResource(
            $subject->load([
                'school',
                'division',
                'classes',
            ])
        );
    }

    public function destroy(
        Request $request,
        Subject $subject
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $subject->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized access to delete this subject.');
        }

        $subject->delete();

        return response()->json([
            'message' => 'Subject deleted successfully.',
        ]);
    }
}

