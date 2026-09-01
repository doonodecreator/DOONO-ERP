<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeatureFlag extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'scope_type',
        'scope_id',
        'is_enabled',
        'rollout_percentage',
        'created_by',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'rollout_percentage' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForScope($query, string $scopeType, ?int $scopeId = null)
    {
        return $query->where('scope_type', $scopeType)->where('scope_id', $scopeId);
    }
}
