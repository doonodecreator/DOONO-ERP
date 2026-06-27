<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Staff extends Model
{
    protected $fillable = [
        'school_id',
        'staff_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'email',
        'phone',
        'address',
        'designation',
        'department',
        'employment_date',
        'qualification',
        'salary',
        'photo',
        'status',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
