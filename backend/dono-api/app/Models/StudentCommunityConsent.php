<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCommunityConsent extends Model
{
    protected $fillable = [
        'school_id',
        'student_id',
        'parent_id',
        'status',
        'video_allowed',
        'global_exchange_allowed',
        'decided_by',
        'decided_at',
    ];

    protected $casts = [
        'video_allowed' => 'boolean',
        'global_exchange_allowed' => 'boolean',
        'decided_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
