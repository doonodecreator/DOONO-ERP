<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamScore extends Model
{
    protected $fillable = [
        'examination_id',
        'student_id',
        'subject_id',
        'score',
        'grade',
        'remark',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
