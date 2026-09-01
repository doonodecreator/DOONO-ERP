<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleInspection extends Model
{
    protected $fillable = [
        'school_id',
        'vehicle_id',
        'inspected_by',
        'inspection_date',
        'status',
        'odometer',
        'notes',
        'next_due_date',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'next_due_date' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }
}

