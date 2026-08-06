<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceptionAppointment extends Model
{
    protected $fillable = [
        'school_id',
        'visitor_name',
        'phone_number',
        'host_staff',
        'appointment_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
