<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Staff;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return StaffResource::collection(
            Staff::with('school')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreStaffRequest $request)
    {
        $staff = Staff::create($request->validated());

        return (new StaffResource(
            $staff->load('school')
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Staff $staff)
    {
        return new StaffResource(
            $staff->load('school')
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(UpdateStaffRequest $request, Staff $staff)
    {
        $staff->update($request->validated());

        return new StaffResource(
            $staff->load('school')
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Staff $staff)
    {
        $staff->delete();

        return response()->json([
            'message' => 'Staff deleted successfully.',
        ]);
    }
}
