<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\School;
use App\Models\User;

class CurrentContextService
{
    /**
     * The single source of truth for "what does this user currently have
     * access to." Every controller/middleware that needs to know a user's
     * organization, school, or onboarding stage should call this — not
     * re-derive it independently.
     */
    public function resolve(User $user): array
    {
        $isPlatformAdmin = $user->isSuperAdmin();

        $school = $this->resolveCurrentSchool($user);
        $organization = $this->resolveCurrentOrganization($user, $school);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'is_platform_admin' => $isPlatformAdmin,
            'organization' => $organization,
            'school' => $school,
            'roles' => $user->roles()->get()->map(fn ($role) => [
                'slug' => $role->slug,
                'name' => $role->name,
                'school_id' => $role->pivot->school_id,
            ]),
            'permissions' => $this->resolvePermissions($user),
            'onboarding_step' => $this->resolveOnboardingStep($isPlatformAdmin, $organization, $school),
        ];
    }

    private function resolveCurrentSchool(User $user): ?School
    {
        // Prefer a school the user holds a role at — covers proprietors
        // post-wizard, and any future staff role assignment.
        $roleWithSchool = $user->roles()
            ->wherePivotNotNull('school_id')
            ->orderByDesc('user_roles.created_at')
            ->first();

        if ($roleWithSchool) {
            return School::find($roleWithSchool->pivot->school_id);
        }

        // Fallback: directly owned school (covers edge cases where role
        // attach failed but the school row exists).
        return $user->ownedSchools()->latest()->first();
    }

    private function resolveCurrentOrganization(User $user, ?School $school): ?Organization
    {
        if ($school) {
            return $school->organization;
        }

        return Organization::where('owner_id', $user->id)->latest()->first();
    }

    private function resolvePermissions(User $user): array
    {
        return $user->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn ($role) => $role->permissions)
            ->pluck('slug')
            ->unique()
            ->values()
            ->all();
    }

    private function resolveOnboardingStep(bool $isPlatformAdmin, ?Organization $organization, ?School $school): string
    {
        if ($isPlatformAdmin) {
            return 'complete';
        }

        if (!$organization) {
            // Shouldn't normally happen post-registration — registration
            // always creates one — but handled explicitly rather than
            // silently null-ing downstream.
            return 'organization_setup';
        }

        if (!$school) {
            return 'school_setup';
        }

        return 'complete';
    }
}
