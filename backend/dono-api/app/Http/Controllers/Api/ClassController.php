<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Resources\ClassResource;
use App\Models\ClassModel;

class ClassController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ClassResource::collection(
            ClassModel::with([
                'division',
                'streams',
            ])
            ->orderBy('display_order')
            ->paginate(10)
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
    public function show(ClassModel $class)
    {
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
    public function destroy(ClassModel $class)
    {
        $class->delete();

        return response()->json([
            'message' =>
                'Class deleted successfully.',
        ]);
    }
}
