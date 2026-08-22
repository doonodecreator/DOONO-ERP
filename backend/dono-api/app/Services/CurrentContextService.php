<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\School;
use App\Models\User;

class CurrentContextService
{
    public function __construct(
        protected TenantPartitionService $tenantPartitions,
        protected MediaStorageService $media,
    ) {}

    /**
     * Resolve the authenticated user's complete platform context.
     *
     * This is the single source of truth for:
     * - current organization
     * - current school
     * - roles
     * - permissions
     * - onboarding stage
     */
    public function resolve(User $user): array
    {
        $isPlatformAdmin = $user->isSuperAdmin();
        $school = $this->currentSchool($user);
        $organization = $this->currentOrganization($user, $school);
        $isOrgOwner = $this->isOrganizationOwner($user);

        // Resolve every membership for context switching, then derive the
        // active-school role set used by the frontend and permission checks.
        $allRoles = $user->roles()
            ->get()
            ->map(fn ($role) => [
                'slug' => $role->slug,
                'name' => $role->name,
                'school_id' => $role->pivot->school_id,
                'permissions' => $role->permissions->pluck('slug')->all(),
            ]);

        $roles = $allRoles->values();

        // If an Organization Owner has entered a school, grant them the Proprietor role for that school
        if ($isOrgOwner && $school && $organization && $organization->owner_id === $user->id) {
            $hasProprietorRole = $roles->contains(function ($r) use ($school) {
                return $r['slug'] === 'proprietor' && (int)$r['school_id'] === (int)$school->id;
            });

            if (!$hasProprietorRole) {
                $proprietorRole = \App\Models\Role::where('slug', 'proprietor')->first();
                $roles->push([
                    'slug' => 'proprietor',
                    'name' => 'Proprietor',
                    'school_id' => $school->id,
                    'permissions' => $proprietorRole ? $proprietorRole->permissions->pluck('slug')->all() : [],
                ]);
            }
        }

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'avatar_url' => $this->media->url($user->avatar),
                'must_change_password' => (bool) $user->must_change_password,
                'password_changed_at' => $user->password_changed_at,
            ],
            'is_platform_admin' => $isPlatformAdmin,
            'is_organization_owner' => $isOrgOwner,
            'organization' => $organization,
            'school' => $school,
            'tenant_partition' => $this->tenantPartitions->forSchool($school),
            'roles' => $this->presentRoles($roles, $school?->id, $isPlatformAdmin),
            'all_roles' => $roles->map(fn($r) => collect($r)->except('permissions')->all())->values(),
            'permissions' => $this->activePermissions($roles, $school?->id, $isPlatformAdmin),
            'onboarding_step' => $this->resolveOnboardingStep(
                $isPlatformAdmin,
                $organization,
                $school
            ),
        ];
    }

    /**
     * Resolve the user's current school.
     *
     * Priority:
     * 1. School attached to one of the user's roles.
     * 2. A school directly owned by the user.
     */
    public function currentSchool(User $user): ?School
    {
        // 1. Explicitly selected school (stored on user profile)
        // If current_school_id is set, we use it. If it's NULL, it means the user
        // intentionally chose the Organization context (for owners).
        if ($user->current_school_id) {
            $selectedSchool = School::find($user->current_school_id);
            if ($selectedSchool) {
                // Ensure the user actually has access to this school
                $isOwner = $selectedSchool->owner_id === $user->id;
                $hasRole = $user->roles()->wherePivot('school_id', $selectedSchool->id)->exists();

                if ($isOwner || $hasRole) {
                    return $selectedSchool;
                }
            }
        }

        // 2. If the user is an Organization Owner, we don't fall back.
        // We let them stay in the Organization context unless they explicitly select a school.
        if ($this->isOrganizationOwner($user)) {
            return null;
        }

        // 3. Fallback for staff: School attached to one of the user's roles.
        $roleWithSchool = $user->roles()
            ->wherePivotNotNull('school_id')
            ->orderByDesc('user_roles.created_at')
            ->first();

        if ($roleWithSchool && $roleWithSchool->pivot->school_id) {
            return School::find($roleWithSchool->pivot->school_id);
        }

        // 4. Final fallback: First school directly owned by the user (only if not an Org Owner).
        return $user->ownedSchools()
            ->latest()
            ->first();
    }

    /**
     * Resolve the user's current organization.
     */
    public function currentOrganization(
        User $user,
        ?School $school = null
    ): ?Organization {
        if ($school) {
            return $school->organization;
        }

        return Organization::where('owner_id', $user->id)
            ->latest()
            ->first();
    }

    /**
     * Determine whether the user owns at least one organization.
     */
    public function isOrganizationOwner(User $user): bool
    {
        return Organization::where('owner_id', $user->id)->exists();
    }

    /**
     * Determine whether the user may manage the specified organization.
     * Platform owners can manage all organizations; organization owners can
     * manage only records they own.
     */
    public function canManageOrganization(User $user, Organization $organization): bool
    {
        return $user->isSuperAdmin() || $organization->owner_id === $user->id;
    }

    private function presentRoles($roles, ?int $schoolId, bool $isPlatformAdmin): array
    {
        $visible = $isPlatformAdmin
            ? $roles
            : ($schoolId === null
                ? $roles->filter(fn ($role) => $role['school_id'] === null)
                : $roles->filter(fn ($role) => (int) $role['school_id'] === $schoolId));

        return $visible
            ->map(fn ($role) => collect($role)->except('permissions')->all())
            ->values()
            ->all();
    }

    private function activePermissions($roles, ?int $schoolId, bool $isPlatformAdmin): array
    {
        $visible = $isPlatformAdmin
            ? $roles
            : ($schoolId === null
                ? $roles->filter(fn ($role) => $role['school_id'] === null)
                : $roles->filter(fn ($role) => (int) $role['school_id'] === $schoolId));

        return $visible
            ->flatMap(fn ($role) => $role['permissions'])
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Resolve onboarding state.
     */
    private function resolveOnboardingStep(
        bool $isPlatformAdmin,
        ?Organization $organization,
        ?School $school
    ): string {
        if ($isPlatformAdmin) {
            return 'complete';
        }

        if (!$organization) {
            return 'organization_setup';
        }

        // Only force school setup if the organization has ZERO schools.
        // If they have schools but haven't selected one (school is null),
        // they should see the Organization Dashboard, not the setup page.
        $hasSchools = $organization->schools()->exists();
        if (!$hasSchools) {
            return 'school_setup';
        }

        return 'complete';
    }
}
