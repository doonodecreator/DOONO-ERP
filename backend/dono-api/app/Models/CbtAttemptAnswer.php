<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CbtAttemptAnswer extends Model
{
    protected $fillable = [
        'cbt_attempt_id', 'cbt_assessment_question_id', 'selected_answer',
        'is_correct', 'awarded_marks', 'answered_at',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'awarded_marks' => 'decimal:2',
        'answered_at' => 'datetime',
    ];

    public function attempt(): BelongsTo { return $this->belongsTo(CbtAttempt::class, 'cbt_attempt_id'); }
    public function assessmentQuestion(): BelongsTo { return $this->belongsTo(CbtAssessmentQuestion::class, 'cbt_assessment_question_id'); }
}
