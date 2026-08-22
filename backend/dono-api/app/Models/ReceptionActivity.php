<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceptionActivity extends Model
{
    protected $fillable = [
        'school_id',
        'type',
        'staff_id',
        'contact_name',
        'phone',
        'subject',
        'message',
        'status',
        'logged_at',
        'created_by',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
