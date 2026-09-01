<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolMarketplaceInstallation extends Model
{
    protected $fillable = [
        'school_id',
        'marketplace_app_id',
        'installed_by',
        'status',
        'configuration',
        'installed_at',
        'revoked_at',
    ];

    protected $hidden = ['configuration'];

    protected function casts(): array
    {
        return [
            'configuration' => 'encrypted:array',
            'installed_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function app(): BelongsTo
    {
        return $this->belongsTo(MarketplaceApp::class, 'marketplace_app_id');
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }
}
