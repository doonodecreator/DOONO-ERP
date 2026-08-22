<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransportLog extends Model
{
    protected $fillable = [
        'school_id', 'vehicle_id', 'type', 'amount', 'quantity', 'odometer',
        'service_date', 'description', 'status', 'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'quantity' => 'decimal:2',
        'service_date' => 'date',
    ];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }
    public function recorder(): BelongsTo { return $this->belongsTo(User::class, 'recorded_by'); }
}
