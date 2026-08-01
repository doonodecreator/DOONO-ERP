<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDivisionRequest;
use App\Http\Requests\UpdateDivisionRequest;
use App\Http\Resources\DivisionResource;
use App\Models\Division;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Division::with('school')
            ->orderBy('display_order');

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return DivisionResource::collection(
            $query->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreDivisionRequest $request)
    {
        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $request->user()->currentSchoolId();
        }

        $division = Division::create($data);

        return (new DivisionResource(
            $division->load('school')
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Division $division)
    {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        return new DivisionResource(
            $division->load('school')
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(
        UpdateDivisionRequest $request,
        Division $division
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $data = $request->validated();

        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin()
        ) {
            $data['school_id'] = $division->school_id;
        }

        $division->update($data);

        return new DivisionResource(
            $division->load('school')
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(
        Request $request,
        Division $division
    ) {
        if (
            method_exists($request->user(), 'isSuperAdmin') &&
            ! $request->user()->isSuperAdmin() &&
            $division->school_id !== $request->user()->currentSchoolId()
        ) {
            abort(403, 'Unauthorized.');
        }

        $division->delete();

        return response()->json([
            'message' => 'Division deleted successfully.',
        ]);
    }
}
