<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Result extends Model
{
    protected $fillable = [
        'school_id',
        'result_submission_id',
        'student_enrollment_id',
        'subject_id',
        'academic_session_id',
        'term_id',
        'ca_score',
        'exam_score',
        'total_score',
        'grade',
        'remark',
        'position',
        'is_published',
        'status',
        'approved_by',
        'approved_at',
        'published_at',
        'published_by',
        'locked_at',
    ];

    protected $casts = [
        'ca_score' => 'decimal:2',
        'exam_score' => 'decimal:2',
        'total_score' => 'decimal:2',
        'is_published' => 'boolean',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    /**
     * School.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Result submission.
     */
    public function resultSubmission(): BelongsTo
    {
        return $this->belongsTo(ResultSubmission::class);
    }

    /**
     * Student enrollment.
     */
    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    /**
     * Subject.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Academic session.
     */
    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    /**
     * Term.
     */
    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    /**
     * Result components.
     */
    public function components(): HasMany
    {
        return $this->hasMany(ResultComponent::class);
    }

    /**
     * Approver.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Publisher.
     */
    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
