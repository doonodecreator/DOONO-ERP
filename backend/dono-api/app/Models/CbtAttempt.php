<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtAttempt extends Model
{
    protected $fillable = [
        'school_id', 'cbt_assessment_id', 'student_enrollment_id', 'attempt_number',
        'started_at', 'expires_at', 'submitted_at', 'status', 'correct_answers',
        'total_questions', 'question_order', 'score', 'percentage',
    ];

    protected $casts = [
        'started_at' => 'datetime', 'expires_at' => 'datetime', 'submitted_at' => 'datetime',
        'question_order' => 'array',
        'score' => 'decimal:2', 'percentage' => 'decimal:2',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function assessment(): BelongsTo { return $this->belongsTo(CbtAssessment::class, 'cbt_assessment_id'); }
    public function enrollment(): BelongsTo { return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id'); }
    public function answers(): HasMany { return $this->hasMany(CbtAttemptAnswer::class); }
}
