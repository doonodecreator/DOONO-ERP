<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtAssessmentQuestion extends Model
{
    protected $fillable = [
        'cbt_assessment_id', 'cbt_question_id', 'display_order', 'marks',
        'question_snapshot', 'options_snapshot', 'correct_answer_snapshot',
    ];

    protected $casts = ['options_snapshot' => 'array'];

    public function assessment(): BelongsTo { return $this->belongsTo(CbtAssessment::class, 'cbt_assessment_id'); }
    public function question(): BelongsTo { return $this->belongsTo(CbtQuestion::class, 'cbt_question_id'); }
    public function answers(): HasMany { return $this->hasMany(CbtAttemptAnswer::class); }
}
