<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformAnnouncement extends Model
{
    protected $fillable = [
        'created_by',
        'subject',
        'body',
        'action_url',
        'action_label',
        'audience',
        'target_role',
        'target_school_ids',
        'target_user_ids',
        'status',
        'recipient_count',
        'sent_at',
    ];

    protected $casts = [
        'recipient_count' => 'integer',
        'target_school_ids' => 'array',
        'target_user_ids' => 'array',
        'sent_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
