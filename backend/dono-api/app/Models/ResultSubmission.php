<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResultSubmission extends Model
{
    protected $fillable = [
        'school_id',
        'class_id',
        'subject_id',
        'academic_session_id',
        'term_id',
        'status',
        'created_by',
        'approved_by',
        'submitted_at',
        'approved_at',
        'published_at',
        'approval_note',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
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
     * Class.
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    /**
     * Subject.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
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
     * Teacher/User that created the submission.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User that approved the submission.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Results in this submission.
     *
     * We'll connect this after adding
     * result_submission_id to the results table.
     */
    public function results(): HasMany
    {
        return $this->hasMany(Result::class);
    }
}
