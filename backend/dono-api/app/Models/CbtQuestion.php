<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CbtQuestion extends Model
{
    protected $fillable = [
        'school_id',
        'examination_id',
        'subject_id',
        'section',
        'topic',
        'difficulty',
        'created_by',
        'question',
        'options',
        'correct_answer',
        'marks',
        'question_order',
        'batch_key',
        'is_active',
        'approval_status',
        'reviewed_by',
        'reviewed_at',
        'review_note',
    ];

    protected $casts = [
        'options' => 'array',
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
        'marks' => 'integer',
        'question_order' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
