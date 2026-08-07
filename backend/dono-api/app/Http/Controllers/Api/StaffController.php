<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Role;
use App\Models\Staff;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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

    public function store(StoreStaffRequest $request)
    {
        $data = $request->validated();

        if ($request->user()->isSuperAdmin()) {

            if (empty($data['school_id'])) {
                return response()->json([
                    'message' => 'school_id is required.'
                ], 422);
            }

            $schoolId = $data['school_id'];

        } else {

            $schoolId = $this->currentSchoolId($request);

            if (! $schoolId) {
                return response()->json([
                    'message' => 'No school is assigned to this user.'
                ], 422);
            }

            $data['school_id'] = $schoolId;
        }

        $staff = DB::transaction(function () use ($data, $schoolId) {
            $newUser = User::create([
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $role = Role::where('slug', $data['role_slug'])->first();

            if ($role) {
                $newUser->roles()->attach($role->id, [
                    'school_id' => $schoolId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $staffData = collect($data)
                ->except(['email', 'password', 'role_slug'])
                ->toArray();
            $staffData['user_id'] = $newUser->id;

            return Staff::create($staffData);
        });

        ActivityLogService::log(
            module: 'staff',
            action: 'created',
            description: "Staff member \"{$staff->first_name} {$staff->last_name}\" added as {$data['role_slug']}",
            subject: $staff,
            schoolId: $schoolId,
        );

        return (
            new StaffResource(
                $staff->load(['school', 'user.roles'])
            )
        )
        ->response()
        ->setStatusCode(201);
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
