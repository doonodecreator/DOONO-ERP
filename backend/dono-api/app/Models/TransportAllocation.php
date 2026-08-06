<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransportAllocation extends Model
{
    protected $fillable = [
        'school_id',
        'transport_route_id',
        'student_id',
        'pickup_point',
        'status',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function route()
    {
        return $this->belongsTo(TransportRoute::class, 'transport_route_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
