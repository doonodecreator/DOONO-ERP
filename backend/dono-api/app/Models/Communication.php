<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Communication extends Model
{
    protected $fillable = [
        'school_id',
        'sender_id',
        'recipient_id',
        'type',
        'audience',
        'subject',
        'body',
        'published_at',
        'read_at',
        'is_published',
        'delivery_channel',
        'delivery_status',
        'delivery_recipient_count',
        'delivery_attempted_at',
        'delivered_at',
        'delivery_error',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'read_at' => 'datetime',
        'is_published' => 'boolean',
        'delivery_recipient_count' => 'integer',
        'delivery_attempted_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(CommunicationRead::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(CommunicationDelivery::class);
    }
}
