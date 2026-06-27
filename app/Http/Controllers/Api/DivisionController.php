<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDivisionRequest;
use App\Http\Requests\UpdateDivisionRequest;
use App\Http\Resources\DivisionResource;
use App\Models\Division;

class DivisionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return DivisionResource::collection(
            Division::with('school')
                ->orderBy('display_order')
                ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreDivisionRequest $request)
    {
        $division = Division::create($request->validated());

        return (new DivisionResource(
            $division->load('school')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Division $division)
    {
        return new DivisionResource(
            $division->load('school')
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateDivisionRequest $request, Division $division)
    {
        $division->update($request->validated());

        return new DivisionResource(
            $division->load('school')
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Division $division)
    {
        $division->delete();

        return response()->json([
            'message' => 'Division deleted successfully.'
        ]);
    }
}
