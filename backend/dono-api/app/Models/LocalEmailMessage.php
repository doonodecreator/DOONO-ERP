<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocalEmailMessage extends Model
{
    protected $fillable = [
        'recipient_user_id',
        'recipient_email',
        'message_type',
        'subject',
        'body_html',
        'body_text',
        'action_data',
        'read_at',
    ];

    protected $casts = [
        'action_data' => 'array',
        'read_at' => 'datetime',
    ];

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
