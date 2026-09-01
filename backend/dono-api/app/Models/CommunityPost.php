<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    protected $fillable = [
        'school_id',
        'author_student_id',
        'body',
        'scope',
        'status',
        'media_path',
        'media_mime',
        'media_size',
        'moderation_notes',
        'moderated_by',
        'moderated_at',
        'published_at',
    ];

    protected $casts = [
        'media_size' => 'integer',
        'moderated_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'author_student_id');
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CommunityComment::class)->oldest();
    }
}
