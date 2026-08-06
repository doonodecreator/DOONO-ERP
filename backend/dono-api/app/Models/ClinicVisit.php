<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicVisit extends Model
{
    protected $fillable = [
        'school_id',
        'student_id',
        'visit_date',
        'complaint',
        'treatment_given',
        'nurse_notes',
        'treated_by',
    ];

    protected $casts = [
        'visit_date' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function treatedBy()
    {
        return $this->belongsTo(User::class, 'treated_by');
    }
}
