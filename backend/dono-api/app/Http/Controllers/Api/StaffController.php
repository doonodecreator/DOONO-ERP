<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Staff;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private \App\Services\MediaStorageService $media,
    ) {}


    public function index(Request $request)
    {
        $query = Staff::with(['school', 'user.roles'])->where('school_id', $this->requireSchool($request));
        return StaffResource::collection($query->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Direct staff account creation is disabled. Create a school-scoped role invitation instead.', 'workflow' => 'role-invitations'], 410);
    }

    public function show(Request $request, Staff $staff)
    {
        $this->ensureSchool($request, $staff);
        return new StaffResource($staff->load(['school', 'user.roles']));
    }

    public function update(UpdateStaffRequest $request, Staff $staff)
    {
        $schoolId = $this->ensureSchool($request, $staff);
        $before = $staff->employment_status;
        $data = $request->validated();
        unset($data['school_id']);
        if ($request->hasFile('photo')) {
            $data['photo'] = $this->media->storeImage($request->file('photo'), 'schools/' . $schoolId . '/staff', $staff->photo);
        }
        $staff->update($data);

        if (array_key_exists('employment_status', $data) && $data['employment_status'] !== $before) {
            if ($data['employment_status'] === 'Active') {
                ActivityLogService::log(module: 'staff', action: 'employment_reactivated', description: "Staff {$staff->full_name} was reactivated.", subject: $staff, schoolId: $schoolId);
            } else {
                $this->revokeSchoolAccess($staff, $schoolId);
                ActivityLogService::log(module: 'staff', action: 'employment_status_changed', description: "Staff {$staff->full_name} status changed to {$data['employment_status']} and school access was revoked.", subject: $staff, properties: ['status' => $data['employment_status']], schoolId: $schoolId);
            }
        }

        return new StaffResource($staff->fresh()->load(['school', 'user.roles']));
    }

    public function destroy(Request $request, Staff $staff)
    {
        $schoolId = $this->ensureSchool($request, $staff);
        $this->revokeSchoolAccess($staff, $schoolId);
        $staff->update(['employment_status' => 'Terminated', 'user_id' => null]);

        ActivityLogService::log(module: 'staff', action: 'terminated', description: "Staff {$staff->full_name} was terminated and school access was revoked.", subject: $staff, schoolId: $schoolId);
        return response()->json(['message' => 'Staff employment was terminated and school access was revoked. Historical records were preserved.']);
    }

    private function revokeSchoolAccess(Staff $staff, int $schoolId): void
    {
        $user = $staff->user;
        if (!$user) return;
        $user->roles()->wherePivot('school_id', $schoolId)->detach();
        if ((int) $user->current_school_id === $schoolId) $user->update(['current_school_id' => null]);
    }

    private function ensureSchool(Request $request, Staff $staff): int
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $staff->school_id === $schoolId, 403);
        return $schoolId;
    }
}
