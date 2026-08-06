<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    protected $fillable = [
        'school_id',
        'division_id',
        'class_id',
        'stream_id',
        'academic_session_id',
        'admission_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'admission_date',
        'photo',
        'religion',
        'nationality',
        'state_of_origin',
        'local_government',
        'address',
        'blood_group',
        'genotype',
        'medical_notes',
        'status',
    ];

    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ])));
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
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

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function examScores(): HasMany
    {
        return $this->hasMany(ExamScore::class);
    }

        public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(
            Guardian::class,
            'guardian_student',
            'student_id',
            'guardian_id'
        )->withPivot('relation_type')->withTimestamps();
    }


    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(
            ParentModel::class,
            'parent_student',
            'student_id',
            'parent_id'
        );
    }
}

