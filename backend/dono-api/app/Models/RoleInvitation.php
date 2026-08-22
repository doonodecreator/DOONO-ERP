<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class RoleInvitation extends Model
{
    protected $fillable = [
        'school_id',
        'role_id',
        'form_class_id',
        'form_stream_id',
        'invited_by',
        'accepted_user_id',
        'staff_id',
        'revoked_by',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'designation',
        'department',
        'staff_number',
        'employment_date',
        'token_hash',
        'status',
        'expires_at',
        'accepted_at',
        'revoked_at',
    ];

    protected $hidden = [
        'token_hash',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'revoked_at' => 'datetime',
        'employment_date' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function formClass(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'form_class_id');
    }

    public function formStream(): BelongsTo
    {
        return $this->belongsTo(Stream::class, 'form_stream_id');
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function acceptedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_user_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending'
            && ! $this->revoked_at
            && $this->expires_at?->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->status === 'pending'
            && $this->expires_at?->isPast();
    }
}
