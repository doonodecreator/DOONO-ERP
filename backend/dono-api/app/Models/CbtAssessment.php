<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CbtAssessment extends Model
{
    protected $fillable = [
        'school_id', 'examination_id', 'class_id', 'subject_id', 'academic_session_id', 'term_id',
        'created_by', 'assessment_structure_id', 'result_submission_id', 'results_reviewed_by', 'title', 'instructions', 'duration_minutes', 'total_marks',
        'pass_mark', 'result_weight', 'max_attempts', 'available_from', 'available_until', 'status', 'results_status',
        'shuffle_questions', 'results_reviewed_at', 'results_published_at', 'review_note',
    ];

    protected $casts = [
        'available_from' => 'datetime',
        'available_until' => 'datetime',
        'results_reviewed_at' => 'datetime',
        'results_published_at' => 'datetime',
        'shuffle_questions' => 'boolean',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function examination(): BelongsTo { return $this->belongsTo(Examination::class); }
    public function class(): BelongsTo { return $this->belongsTo(ClassModel::class, 'class_id'); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function academicSession(): BelongsTo { return $this->belongsTo(AcademicSession::class); }
    public function term(): BelongsTo { return $this->belongsTo(Term::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'results_reviewed_by'); }
    public function assessmentStructure(): BelongsTo { return $this->belongsTo(AssessmentStructure::class); }
    public function resultSubmission(): BelongsTo { return $this->belongsTo(ResultSubmission::class); }
    public function questions(): HasMany { return $this->hasMany(CbtAssessmentQuestion::class); }
    public function attempts(): HasMany { return $this->hasMany(CbtAttempt::class); }
}
