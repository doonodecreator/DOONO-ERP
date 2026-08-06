<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransportRoute extends Model
{
    protected $fillable = [
        'school_id',
        'route_name',
        'description',
        'vehicle_id',
        'fare_amount',
    ];

    protected $casts = [
        'fare_amount' => 'decimal:2',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function allocations()
    {
        return $this->hasMany(TransportAllocation::class);
    }
}
