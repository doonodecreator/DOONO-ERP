<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HostelAllocation extends Model
{
    protected $fillable = [
        'school_id',
        'hostel_room_id',
        'student_id',
        'bed_space',
        'allocated_date',
        'status',
    ];

    protected $casts = [
        'allocated_date' => 'date',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function hostelRoom()
    {
        return $this->belongsTo(HostelRoom::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
