<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    protected $fillable = [
        'school_id',
        'visitor_name',
        'phone_number',
        'to_see',
        'purpose',
        'check_in_time',
        'check_out_time',
        'status',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}
