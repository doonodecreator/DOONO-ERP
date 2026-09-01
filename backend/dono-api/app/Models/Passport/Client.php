<?php

namespace App\Models\Passport;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Passport\Client as PassportClient;

class Client extends PassportClient
{
    protected $fillable = [
        'school_id',
        'created_by',
        'name',
        'secret',
        'provider',
        'redirect_uris',
        'grant_types',
        'scopes',
        'revoked',
    ];

    protected $casts = [
        'grant_types' => 'array',
        'redirect_uris' => 'array',
        'scopes' => 'array',
        'revoked' => 'boolean',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
