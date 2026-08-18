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
        'email_verified_at',
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
    | Current School Helper
    |--------------------------------------------------------------------------
    */

    public function currentSchoolId(): ?int
    {
        // First try a role assigned to a specific school.
        $schoolId = $this->roles()
            ->wherePivotNotNull('school_id')
            ->value('user_roles.school_id');

        if ($schoolId) {
            return (int) $schoolId;
        }

        // Otherwise fall back to the first school the user owns.
        return $this->ownedSchools()->value('id');
    }

    /*
    |--------------------------------------------------------------------------
    | Role & Permission Helpers
    |--------------------------------------------------------------------------
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

    public function hasPermission(string $permissionSlug, ?int $schoolId = null): bool
    {
        $roles = $this->roles();

        if ($schoolId !== null) {
            $roles->wherePivot('school_id', $schoolId);
        }

        if ($roles
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists()) {
            return true;
        }

        if ($schoolId === null) {
            return false;
        }

        return SchoolSetupDelegation::query()
            ->where('school_id', $schoolId)
            ->where('user_id', $this->id)
            ->whereHas('permission', function ($query) use ($permissionSlug) {
                $query->where('slug', $permissionSlug);
            })
            ->exists();
    }
}
