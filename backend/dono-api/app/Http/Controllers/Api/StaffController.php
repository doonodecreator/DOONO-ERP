<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $query = Staff::with('school');

        if (! $request->user()->isSuperAdmin()) {
            $query->where(
                'school_id',
                $request->user()->currentSchoolId()
            );
        }

        return StaffResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(StoreStaffRequest $request)
    {
        $data = $request->validated();

        if ($request->user()->isSuperAdmin()) {

            if (empty($data['school_id'])) {
                return response()->json([
                    'message' => 'school_id is required.'
                ], 422);
            }

        } else {

            $schoolId = $request->user()->currentSchoolId();

            if (! $schoolId) {
                return response()->json([
                    'message' => 'No school is assigned to this user.'
                ], 422);
            }

            $data['school_id'] = $schoolId;
        }

        $staff = Staff::create($data);

        return (
            new StaffResource(
                $staff->load('school')
            )
        )
        ->response()
        ->setStatusCode(201);
    }

    public function show(Request $request, Staff $staff)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403);
        }

        return new StaffResource(
            $staff->load('school')
        );
    }

    public function update(
        UpdateStaffRequest $request,
        Staff $staff
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403);
        }

        $staff->update(
            $request->validated()
        );

        return new StaffResource(
            $staff->load('school')
        );
    }

    public function destroy(
        Request $request,
        Staff $staff
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $request->user()->currentSchoolId()
        ) {
            abort(403);
        }

        $staff->delete();

        return response()->json([
            'message' => 'Staff deleted successfully.'
        ]);
    }
}
