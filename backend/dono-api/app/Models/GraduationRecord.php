<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GraduationRecord extends Model
{
    protected $fillable = [
        'school_id', 'student_id', 'academic_session_id', 'graduation_date',
        'certificate_number', 'destination', 'status', 'notes', 'created_by',
    ];

    protected $casts = ['graduation_date' => 'date'];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function academicSession(): BelongsTo { return $this->belongsTo(AcademicSession::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
