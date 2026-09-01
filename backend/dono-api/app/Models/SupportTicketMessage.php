<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'body',
        'attachment_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'canned_reply_key',
        'is_internal_note',
    ];

    protected $casts = [
        'is_internal_note' => 'boolean',
        'size_bytes' => 'integer',
    ];

    protected $hidden = ['attachment_path'];

    protected $appends = ['attachment_available'];

    public function getAttachmentAvailableAttribute(): bool
    {
        return filled($this->attachment_path);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
