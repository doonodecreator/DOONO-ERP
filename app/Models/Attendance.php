<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'student_id',
        'attendance_date',
        'status',
        'remarks',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
