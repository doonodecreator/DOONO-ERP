<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPromotion extends Model
{
    protected $fillable = [
        'school_id',
        'student_id',

        'from_academic_session_id',
        'to_academic_session_id',

        'from_division_id',
        'to_division_id',

        'from_class_id',
        'to_class_id',

        'from_stream_id',
        'to_stream_id',

        'promotion_date',
        'promotion_status',
        'remarks',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function fromAcademicSession(): BelongsTo
    {
        return $this->belongsTo(
            AcademicSession::class,
            'from_academic_session_id'
        );
    }

    public function toAcademicSession(): BelongsTo
    {
        return $this->belongsTo(
            AcademicSession::class,
            'to_academic_session_id'
        );
    }

    public function fromDivision(): BelongsTo
    {
        return $this->belongsTo(
            Division::class,
            'from_division_id'
        );
    }

    public function toDivision(): BelongsTo
    {
        return $this->belongsTo(
            Division::class,
            'to_division_id'
        );
    }

    public function fromClass(): BelongsTo
    {
        return $this->belongsTo(
            ClassModel::class,
            'from_class_id'
        );
    }

    public function toClass(): BelongsTo
    {
        return $this->belongsTo(
            ClassModel::class,
            'to_class_id'
        );
    }

    public function fromStream(): BelongsTo
    {
        return $this->belongsTo(
            Stream::class,
            'from_stream_id'
        );
    }

    public function toStream(): BelongsTo
    {
        return $this->belongsTo(
            Stream::class,
            'to_stream_id'
        );
    }
}
