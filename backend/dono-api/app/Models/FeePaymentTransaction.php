<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeePaymentTransaction extends Model
{
    protected $fillable = [
        'school_id',
        'student_fee_id',
        'gateway',
        'reference',
        'amount',
        'currency',
        'status',
        'gateway_response',
        'paid_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'gateway_response' => 'array',
        'paid_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }
}
