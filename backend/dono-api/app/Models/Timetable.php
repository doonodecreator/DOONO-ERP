<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timetable extends Model
{
    protected $fillable = [
        'school_id',
        'entry_type',
        'schedule_mode',
        'target_type',
        'academic_session_id',
        'term_id',
        'division_id',
        'class_id',
        'stream_id',
        'subject_id',
        'title',
        'description',
        'staff_id',
        'day_of_week',
        'start_time',
        'end_time',
        'event_date',
        'effective_from',
        'effective_until',
        'room',
        'is_active',
        'workflow_status',
        'submitted_at',
        'approved_at',
        'published_at',
        'submitted_by',
        'approved_by',
        'published_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'event_date' => 'date',
        'effective_from' => 'date',
        'effective_until' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
        'submitted_by' => 'integer',
        'approved_by' => 'integer',
        'published_by' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
