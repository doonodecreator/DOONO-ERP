<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationDelivery extends Model
{
    protected $fillable = [
        'school_id',
        'communication_id',
        'user_id',
        'push_token_id',
        'channel',
        'provider',
        'destination',
        'provider_message_id',
        'status',
        'attempts',
        'attempted_at',
        'provider_accepted_at',
        'delivered_at',
        'failed_at',
        'failure_code',
        'failure_message',
        'provider_metadata',
    ];

    protected $hidden = [
        'destination',
        'provider_metadata',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'attempted_at' => 'datetime',
            'provider_accepted_at' => 'datetime',
            'delivered_at' => 'datetime',
            'failed_at' => 'datetime',
            'provider_metadata' => 'array',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function communication(): BelongsTo
    {
        return $this->belongsTo(Communication::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
