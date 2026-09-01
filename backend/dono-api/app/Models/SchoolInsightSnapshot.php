<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolInsightSnapshot extends Model
{
    protected $fillable = [
        'school_id',
        'snapshot_date',
        'period_days',
        'active_students',
        'attendance_records',
        'attendance_percentage',
        'published_result_count',
        'average_published_score',
        'subject_averages',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'attendance_percentage' => 'decimal:1',
        'average_published_score' => 'decimal:1',
        'subject_averages' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}

