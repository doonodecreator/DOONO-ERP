<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleInvitationRequest;
use App\Models\Role;
use App\Models\RoleInvitation;
use App\Models\Staff;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RoleInvitationController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context
    ) {
    }

    public function index(Request $request)
    {
        $schoolId = $this->currentSchoolId($request);

        return response()->json([
            'data' => RoleInvitation::query()
                ->with(['role:id,slug,name', 'staff:id,first_name,last_name'])
                ->where('school_id', $schoolId)
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (RoleInvitation $invitation) => $this->present($invitation))
                ->values(),
        ]);
    }

    public function store(StoreRoleInvitationRequest $request)
    {
        $schoolId = $this->currentSchoolId($request);
        $data = $request->validated();
        $role = Role::where('slug', $data['role_slug'])->firstOrFail();

        if (strcasecmp($data['email'], $request->user()->email) === 0) {
            throw ValidationException::withMessages([
                'email' => ['A proprietor cannot invite their own account into another school role.'],
            ]);
        }

        $duplicate = RoleInvitation::query()
            ->where('school_id', $schoolId)
            ->where('role_id', $role->id)
            ->where('email', $data['email'])
            ->where('status', 'pending')
            ->whereNull('revoked_at')
            ->first();

        if ($duplicate && $duplicate->expires_at?->isFuture()) {
            throw ValidationException::withMessages([
                'email' => ['A pending invitation already exists for this email and role.'],
            ]);
        }

        $plainToken = Str::random(64);
        $invitation = RoleInvitation::create([
            ...collect($data)->except('role_slug')->all(),
            'school_id' => $schoolId,
            'role_id' => $role->id,
            'invited_by' => $request->user()->id,
            'token_hash' => hash('sha256', $plainToken),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        ActivityLogService::log(
            module: 'role_invitations',
            action: 'created',
            description: "Invitation created for {$invitation->email} as {$role->name}.",
            subject: $invitation,
            properties: ['role_slug' => $role->slug],
            schoolId: $schoolId,
        );

        return response()->json([
            'message' => 'Invitation created. Send the one-time acceptance link to the invitee.',
            'data' => $this->present($invitation->load('role')),
            'invitation_token' => $plainToken,
            'accept_path' => '/role-invitation/accept?token=' . urlencode($plainToken),
        ], 201);
    }

    public function preview(string $token)
    {
        $invitation = $this->findByToken($token);

        return response()->json([
            'data' => [
                'first_name' => $invitation->first_name,
                'last_name' => $invitation->last_name,
                'email' => $invitation->email,
                'role' => $invitation->role?->name,
                'school' => $invitation->school?->name,
                'expires_at' => $invitation->expires_at?->toIso8601String(),
            ],
        ]);
    }

    public function accept(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $invitation = $this->findByToken($data['token']);

        if (strcasecmp($invitation->email, $data['email']) !== 0) {
            throw ValidationException::withMessages([
                'email' => ['This email does not match the invitation.'],
            ]);
        }

        if (User::where('email', $data['email'])->exists()) {
            return response()->json([
                'message' => 'This email already has an account. Sign in first, then accept the invitation from the authenticated acceptance action.',
            ], 409);
        }

        [$user, $staff] = DB::transaction(function () use ($data, $invitation) {
            $user = User::create([
                'name' => trim("{$invitation->first_name} {$invitation->last_name}"),
                'email' => $invitation->email,
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);

            $staff = $this->activateInvitation($invitation, $user);

            return [$user, $staff];
        });

        Auth::setUser($user);

        ActivityLogService::log(
            module: 'role_invitations',
            action: 'accepted',
            description: "{$user->email} accepted the {$invitation->role?->name} invitation.",
            subject: $invitation,
            schoolId: $invitation->school_id,
        );

        return response()->json([
            'message' => 'Invitation accepted. Your school role is now active.',
            'token' => $user->createToken('api-token')->plainTextToken,
            'staff_id' => $staff->id,
        ]);
    }

    public function acceptAuthenticated(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
        ]);
        $invitation = $this->findByToken($data['token']);

        if (strcasecmp($invitation->email, $request->user()->email) !== 0) {
            throw ValidationException::withMessages([
                'token' => ['This invitation belongs to a different email address.'],
            ]);
        }

        $staff = DB::transaction(fn () => $this->activateInvitation($invitation, $request->user()));

        ActivityLogService::log(
            module: 'role_invitations',
            action: 'accepted',
            description: "{$request->user()->email} accepted the {$invitation->role?->name} invitation.",
            subject: $invitation,
            schoolId: $invitation->school_id,
        );

        return response()->json([
            'message' => 'Invitation accepted. Your school role is now active.',
            'staff_id' => $staff->id,
        ]);
    }

    public function revoke(Request $request, RoleInvitation $roleInvitation)
    {
        $schoolId = $this->currentSchoolId($request);

        abort_unless((int) $roleInvitation->school_id === $schoolId, 403);
        abort_unless($roleInvitation->status === 'pending', 409, 'Only pending invitations can be revoked.');

        $roleInvitation->update([
            'status' => 'revoked',
            'revoked_by' => $request->user()->id,
            'revoked_at' => now(),
        ]);

        ActivityLogService::log(
            module: 'role_invitations',
            action: 'revoked',
            description: "Invitation for {$roleInvitation->email} was revoked.",
            subject: $roleInvitation,
            schoolId: $schoolId,
        );

        return response()->json([
            'message' => 'Invitation revoked.',
        ]);
    }

    private function activateInvitation(RoleInvitation $invitation, User $user): Staff
    {
        $invitation->refresh();
        abort_unless($invitation->isPending(), 410, 'This invitation is expired or no longer active.');

        $hasRole = $user->roles()
            ->where('roles.id', $invitation->role_id)
            ->wherePivot('school_id', $invitation->school_id)
            ->exists();

        if (! $hasRole) {
            $user->roles()->attach($invitation->role_id, [
                'school_id' => $invitation->school_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $conflictingStaff = Staff::query()
            ->where('school_id', $invitation->school_id)
            ->where('email', $invitation->email)
            ->whereNotNull('user_id')
            ->where('user_id', '!=', $user->id)
            ->exists();

        abort_unless(! $conflictingStaff, 409, 'A different staff account already uses this invitation email at the school.');

        $staff = Staff::query()
            ->where('school_id', $invitation->school_id)
            ->where(function ($query) use ($user, $invitation) {
                $query->where('user_id', $user->id)
                    ->orWhere(function ($nested) use ($invitation) {
                        $nested->where('email', $invitation->email)
                            ->whereNull('user_id');
                    });
            })
            ->first();

        $staffData = [
            'school_id' => $invitation->school_id,
            'user_id' => $user->id,
            'first_name' => $invitation->first_name,
            'middle_name' => $invitation->middle_name,
            'last_name' => $invitation->last_name,
            'gender' => ucfirst(strtolower($invitation->gender)),
            'phone' => $invitation->phone,
            'email' => $invitation->email,
            'designation' => $invitation->designation,
            'department' => $invitation->department,
            'employment_date' => $invitation->employment_date ?? now()->toDateString(),
            'employment_status' => 'Active',
            'basic_salary' => 0,
        ];

        if (! $staff) {
            $staffData['staff_number'] = $invitation->staff_number
                ?: 'STF-' . Str::upper(Str::random(8));
            $staff = Staff::create($staffData);
        } else {
            $staff->update($staffData);
        }

        $invitation->update([
            'status' => 'accepted',
            'accepted_user_id' => $user->id,
            'staff_id' => $staff->id,
            'accepted_at' => now(),
        ]);

        return $staff;
    }

    private function findByToken(string $token): RoleInvitation
    {
        $invitation = RoleInvitation::with(['role', 'school'])
            ->where('token_hash', hash('sha256', $token))
            ->firstOrFail();

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);
        }

        abort_unless($invitation->isPending(), 410, 'This invitation is expired, revoked, or already accepted.');

        return $invitation;
    }

    private function currentSchoolId(Request $request): int
    {
        $schoolId = $request->attributes->get('current_school_id')
            ?? $this->context->currentSchool($request->user())?->id;

        abort_unless($schoolId, 409, 'No active school.');

        return (int) $schoolId;
    }

    private function present(RoleInvitation $invitation): array
    {
        return [
            'id' => $invitation->id,
            'email' => $invitation->email,
            'name' => trim("{$invitation->first_name} {$invitation->last_name}"),
            'role' => $invitation->role?->name,
            'role_slug' => $invitation->role?->slug,
            'designation' => $invitation->designation,
            'status' => $invitation->status,
            'expires_at' => $invitation->expires_at?->toIso8601String(),
            'accepted_at' => $invitation->accepted_at?->toIso8601String(),
        ];
    }
}
