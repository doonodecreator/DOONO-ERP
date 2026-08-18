<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\School;
use App\Models\User;

class CurrentContextService
{
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

        // Resolve base roles
        $roles = $user->roles()
            ->get()
            ->map(fn ($role) => [
                'slug' => $role->slug,
                'name' => $role->name,
                'school_id' => $role->pivot->school_id,
                'permissions' => $role->permissions->pluck('slug')->all(),
            ]);

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
            ],
            'is_platform_admin' => $isPlatformAdmin,
            'is_organization_owner' => $isOrgOwner,
            'organization' => $organization,
            'school' => $school,
            'roles' => $roles->map(fn($r) => collect($r)->except('permissions')->all())->values(),
            'permissions' => $roles->flatMap(fn($r) => $r['permissions'])->unique()->values()->all(),
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

        // 2. Fallback: School attached to one of the user's roles.
        $roleWithSchool = $user->roles()
            ->wherePivotNotNull('school_id')
            ->orderByDesc('user_roles.created_at')
            ->first();

        if ($roleWithSchool && $roleWithSchool->pivot->school_id) {
            return School::find($roleWithSchool->pivot->school_id);
        }

        // 3. Fallback: First school directly owned by the user.
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

    /**
     * Resolve all permissions inherited through the user's roles.
     */
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

        if (!$school) {
            return 'school_setup';
        }

        return 'complete';
    }
}
