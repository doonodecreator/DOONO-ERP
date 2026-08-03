<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('school_id')
            ->withTimestamps();
    }

    public function organizations()
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    public function ownedSchools()
    {
        return $this->hasMany(School::class, 'owner_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Role & Permission Helpers
    |--------------------------------------------------------------------------
    |
    | NOTE: "current organization" / "current school" resolution is NOT done
    | here anymore. That logic depends on more than the User model can see
    | (ownership vs. role assignment vs. platform-admin bypass), so it lives
    | in App\Services\CurrentContextService — the single place that answers
    | "what does this user currently have access to." Do not re-add
    | currentOrganization()/currentSchool() shortcuts here; that duplication
    | is exactly what broke onboarding before.
    |
    */

    /**
     * Does this user hold the given role?
     * $schoolId = null checks for a platform-wide grant of that role.
     * $schoolId = <id> checks for that role scoped to a specific school.
     * Pass 'any' to check regardless of scope.
     */
    public function hasRole(string $slug, null|int|string $schoolId = null): bool
    {
        $query = $this->roles()->where('slug', $slug);

        if ($schoolId === 'any') {
            return $query->exists();
        }

        if ($schoolId === null) {
            return $query->wherePivotNull('school_id')->exists();
        }

        return $query->wherePivot('school_id', $schoolId)->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function hasPermission(string $permissionSlug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }
}
