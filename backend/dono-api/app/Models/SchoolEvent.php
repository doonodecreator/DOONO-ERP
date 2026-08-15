<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolEvent extends Model
{
    protected $fillable = [
        'school_id',
        'title',
        'event_type',
        'description',
        'start_at',
        'end_at',
        'venue',
        'organizer_staff_id',
        'audience',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'organizer_staff_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
