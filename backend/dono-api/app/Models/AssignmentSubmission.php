<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    protected $fillable = [
        'school_id',
        'assignment_id',
        'student_id',
        'submitted_by',
        'answer_text',
        'attachment_url',
        'status',
        'grade',
        'feedback',
        'is_late',
        'submitted_at',
        'graded_by',
        'graded_at',
    ];

    protected $casts = [
        'grade' => 'decimal:2',
        'is_late' => 'boolean',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
