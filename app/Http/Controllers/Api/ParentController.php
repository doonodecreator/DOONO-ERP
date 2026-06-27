<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreParentRequest;
use App\Http\Requests\UpdateParentRequest;
use App\Http\Resources\ParentResource;
use App\Models\ParentModel;

class ParentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ParentResource::collection(
            ParentModel::with('school')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreParentRequest $request)
    {
        $parent = ParentModel::create($request->validated());

        return (new ParentResource(
            $parent->load('school')
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ParentModel $parent)
    {
        return new ParentResource(
            $parent->load([
                'school',
                'students',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateParentRequest $request, ParentModel $parent)
    {
        $parent->update($request->validated());

        return new ParentResource(
            $parent->load([
                'school',
                'students',
            ])
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(ParentModel $parent)
    {
        $parent->delete();

        return response()->json([
            'message' => 'Parent deleted successfully.'
        ]);
    }
}
