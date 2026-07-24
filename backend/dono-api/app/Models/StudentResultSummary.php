<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentResultSummary extends Model
{
    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'school_id',
        'student_enrollment_id',
        'class_id',
        'academic_session_id',
        'term_id',

        'total_score',
        'student_average',
        'position',

        'subjects_offered',
        'subjects_passed',
        'subjects_failed',

        'overall_grade',
        'overall_remark',

        'class_average',
        'highest_average',
        'lowest_average',

        'promotion_status',

        'class_teacher_remark',
        'principal_remark',

        'approved_by',
        'approved_at',

        'is_published',
        'published_at',
    ];

    /**
     * Attribute casting.
     */
    protected $casts = [
        'total_score' => 'decimal:2',
        'student_average' => 'decimal:2',
        'class_average' => 'decimal:2',
        'highest_average' => 'decimal:2',
        'lowest_average' => 'decimal:2',

        'is_published' => 'boolean',

        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    /**
     * School.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Student Enrollment.
     */
    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    /**
     * Class.
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Academic Session.
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
     * Approver.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if published.
     */
    public function isPublished(): bool
    {
        return $this->is_published;
    }

    /**
     * Check if approved.
     */
    public function isApproved(): bool
    {
        return !is_null($this->approved_at);
    }

    /**
     * Check if promoted.
     */
    public function isPromoted(): bool
    {
        return $this->promotion_status === 'Promoted';
    }

    /**
     * Check if repeating.
     */
    public function isRepeating(): bool
    {
        return $this->promotion_status === 'Repeat';
    }

    /**
     * Publish summary.
     */
    public function publish(): void
    {
        $this->update([
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    /**
     * Approve summary.
     */
    public function approve(int $userId): void
    {
        $this->update([
            'approved_by' => $userId,
            'approved_at' => now(),
        ]);
    }
}
