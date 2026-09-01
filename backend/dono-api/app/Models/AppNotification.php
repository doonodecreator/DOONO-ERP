<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends \Illuminate\Database\Eloquent\Model
{
    protected $table = 'app_notifications';

    protected $fillable = [
        'organization_id',
        'school_id',
        'user_id',
        'type',
        'priority',
        'title',
        'body',
        'source_type',
        'source_id',
        'dedupe_key',
        'read_at',
    ];

    protected $casts = [
        'source_id' => 'integer',
        'read_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
