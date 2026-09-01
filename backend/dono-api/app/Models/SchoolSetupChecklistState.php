<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolSetupChecklistState extends Model
{
    protected $fillable = [
        'school_id',
        'step_key',
        'acknowledged',
        'last_viewed_by',
        'last_viewed_at',
        'acknowledged_at',
    ];

    protected $casts = [
        'acknowledged' => 'boolean',
        'last_viewed_at' => 'datetime',
        'acknowledged_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function lastViewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_viewed_by');
    }
}
