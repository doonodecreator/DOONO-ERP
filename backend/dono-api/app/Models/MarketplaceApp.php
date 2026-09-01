<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketplaceApp extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'publisher',
        'description',
        'homepage_url',
        'capabilities',
        'status',
        'review_status',
        'reviewed_by',
        'reviewed_at',
        'security_notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'capabilities' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function installations(): HasMany
    {
        return $this->hasMany(SchoolMarketplaceInstallation::class);
    }
}
