<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Resources\ClassResource;
use App\Models\ClassModel;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ClassModel::with([
            'division',
            'streams',
        ])->orderBy('display_order');

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->whereHas('division', function ($q) use ($request) {
                $q->where(
                    'school_id',
                    $request->user()->currentSchoolId()
                );
            });
        }

        return ClassResource::collection(
            $query->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreClassRequest $request)
    {
        $class = ClassModel::create(
            $request->validated()
        );

        return (
            new ClassResource(
                $class->load([
                    'division',
                    'streams',
                ])
            )
        )
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(
        Request $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        return new ClassResource(
            $class->load([
                'division',
                'streams',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(
        UpdateClassRequest $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $class->update(
            $request->validated()
        );

        return new ClassResource(
            $class->load([
                'division',
                'streams',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(
        Request $request,
        ClassModel $class
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $class->division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $class->delete();

        return response()->json([
            'message' => 'Class deleted successfully.',
        ]);
    }
}
