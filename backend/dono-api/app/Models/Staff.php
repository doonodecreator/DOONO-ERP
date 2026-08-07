<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    protected $table = 'staff';

    protected $fillable = [
        'school_id',
        'user_id',
        'staff_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'phone',
        'email',
        'address',
        'designation',
        'department',
        'employment_date',
        'basic_salary',
        'qualification',
        'photo',
        'employment_status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'employment_date' => 'date',
        'basic_salary' => 'decimal:2',
    ];

    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ])));
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * The login account linked to this staff member, if one was created.
     * Staff created before this feature (or imported historical records)
     * may have no linked user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
