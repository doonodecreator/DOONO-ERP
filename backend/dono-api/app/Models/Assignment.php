<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assignment extends Model
{
    protected $fillable = [
        'school_id',
        'teacher_staff_id',
        'class_id',
        'stream_id',
        'subject_id',
        'created_by',
        'title',
        'description',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function teacher(): BelongsTo { return $this->belongsTo(Staff::class, 'teacher_staff_id'); }
    public function class(): BelongsTo { return $this->belongsTo(ClassModel::class, 'class_id'); }
    public function stream(): BelongsTo { return $this->belongsTo(Stream::class); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function submissions(): HasMany { return $this->hasMany(AssignmentSubmission::class); }
}
