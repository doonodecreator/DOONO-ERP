<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetLifecycleEvent extends Model
{
    protected $fillable = [
        'school_id',
        'asset_id',
        'actor_id',
        'event_type',
        'before_state',
        'after_state',
        'notes',
        'occurred_at',
    ];

    protected $casts = [
        'before_state' => 'array',
        'after_state' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function asset(): BelongsTo { return $this->belongsTo(Asset::class); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }
}
