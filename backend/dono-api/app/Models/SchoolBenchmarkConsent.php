<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolBenchmarkConsent extends Model
{
    protected $fillable = [
        'school_id',
        'is_opted_in',
        'consented_by',
        'consented_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'is_opted_in' => 'boolean',
            'consented_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function consenter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consented_by');
    }
}
