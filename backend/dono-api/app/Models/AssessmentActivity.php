<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentActivity extends Model
{
    protected $fillable = [
        'school_id', 'type', 'name', 'exam_body', 'academic_session_id', 'term_id', 'division_id', 'class_id', 'subject_id', 'scheduled_date', 'candidate_count', 'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'candidate_count' => 'integer',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function academicSession(): BelongsTo { return $this->belongsTo(AcademicSession::class); }
    public function term(): BelongsTo { return $this->belongsTo(Term::class); }
    public function division(): BelongsTo { return $this->belongsTo(Division::class); }
    public function class(): BelongsTo { return $this->belongsTo(ClassModel::class, 'class_id'); }
    public function subject(): BelongsTo { return $this->belongsTo(Subject::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
