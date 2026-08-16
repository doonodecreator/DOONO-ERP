<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(private CurrentContextService $context)
    {
    }

    private function currentSchoolId(Request $request): ?int
    {
        return $this->context->resolve($request->user())['school']['id'] ?? null;
    }

    public function index(Request $request)
    {
        $query = Staff::with(['school', 'user.roles']);

        if (! $request->user()->isSuperAdmin()) {
            $query->where('school_id', $this->currentSchoolId($request));
        }

        return StaffResource::collection(
            $query->latest()->paginate(10)
        );
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Direct staff account creation is disabled. Create a school-scoped role invitation instead.',
            'workflow' => 'role-invitations',
        ], 410);
    }

    public function show(Request $request, Staff $staff)
    {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $this->currentSchoolId($request)
        ) {
            abort(403);
        }

        return new StaffResource(
            $staff->load(['school', 'user.roles'])
        );
    }

    public function update(
        UpdateStaffRequest $request,
        Staff $staff
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $this->currentSchoolId($request)
        ) {
            abort(403);
        }

        $staff->update(
            $request->validated()
        );

        return new StaffResource(
            $staff->load(['school', 'user.roles'])
        );
    }

    public function destroy(
        Request $request,
        Staff $staff
    ) {
        if (
            ! $request->user()->isSuperAdmin()
            && $staff->school_id != $this->currentSchoolId($request)
        ) {
            abort(403);
        }

        $staff->delete();

        return response()->json([
            'message' => 'Staff deleted successfully.'
        ]);
    }
}
