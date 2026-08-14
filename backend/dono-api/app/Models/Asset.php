<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asset extends Model
{
    protected $fillable = [
        'school_id',
        'asset_number',
        'name',
        'category',
        'quantity',
        'unit_of_measure',
        'location',
        'custodian_staff_id',
        'acquisition_date',
        'acquisition_cost',
        'warranty_expires_at',
        'condition',
        'status',
        'notes',
        'registered_by',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'acquisition_cost' => 'decimal:2',
        'warranty_expires_at' => 'date',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function custodian(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'custodian_staff_id');
    }

    public function registrar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }
}
