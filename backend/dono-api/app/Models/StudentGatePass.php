<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGatePass extends Model
{
    protected $fillable = [
        'school_id',
        'student_id',
        'type',
        'authorized_by',
        'reason',
        'pass_date',
    ];

    protected $casts = [
        'pass_date' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
