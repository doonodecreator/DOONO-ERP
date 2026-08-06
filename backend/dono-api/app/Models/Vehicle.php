<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $fillable = [
        'school_id',
        'vehicle_number',
        'model',
        'capacity',
        'driver_name',
        'driver_phone',
        'status',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function routes()
    {
        return $this->hasMany(TransportRoute::class);
    }
}
