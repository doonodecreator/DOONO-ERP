<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use App\Mail\PasswordResetMail;
use App\Services\EmailDeliveryService;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmailContract
{
    use HasApiTokens, HasFactory, Notifiable, MustVerifyEmailTrait;

    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'must_change_password',
        'password_changed_at',
        'email_verified_at',
        'current_school_id',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorageService::class)->url($this->avatar);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function sendPasswordResetNotification($token): void
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');
        $resetUrl = $frontendUrl.'/forgot-password/reset?token='.urlencode($token).'&email='.urlencode($this->email);
        app(EmailDeliveryService::class)->deliverOne(
            user: $this,
            email: $this->email,
            messageType: 'password_reset',
            subject: 'Reset your DONO School ERP password',
            bodyText: "Hello {$this->name},\n\nReset your password here:\n{$resetUrl}\n\nIf you did not request this, ignore this message.",
            actionData: ['action_url' => $resetUrl, 'action_label' => 'Reset password'],
            mailable: new PasswordResetMail($this, $token),
        );
    }

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

    public function currentSchool()
    {
        return $this->belongsTo(School::class, 'current_school_id');
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

        if ($schoolId === null || ! Schema::hasTable('school_setup_delegations')) {
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
