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
        'role',
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
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function schools()
    {
        return $this->hasMany(School::class, 'owner_id');
    }

    /*
|--------------------------------------------------------------------------
| Current School Helpers
|--------------------------------------------------------------------------
*/

public function currentSchool()
{
    return $this->schools()->first();
}

public function currentSchoolId()
{
    return optional($this->currentSchool())->id;
}
    /*
    |--------------------------------------------------------------------------
    | Role & Permission Helpers
    |--------------------------------------------------------------------------
    */

    public function hasRole($role)
    {
        return $this->role === $role
            || $this->roles()->where('slug', $role)->exists();
    }

    public function hasPermission($permission)
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permission) {
                $query->where('slug', $permission);
            })
            ->exists();
    }

    public function permissions()
    {
        return $this->roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id');
    }

    /*
    |--------------------------------------------------------------------------
    | Super Admin Helper
    |--------------------------------------------------------------------------
    */

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }
}
