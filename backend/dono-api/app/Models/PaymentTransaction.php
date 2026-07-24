<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = [

        'school_id',

        'school_subscription_id',

        'gateway',

        'reference',

        'gateway_transaction_id',

        'amount',

        'currency',

        'billing_cycle',

        'status',

        'gateway_response',

        'paid_at',

        'failure_reason',

        'is_refunded',
    ];

    protected $casts = [

        'amount' => 'decimal:2',

        'gateway_response' => 'array',

        'paid_at' => 'datetime',

        'is_refunded' => 'boolean',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function schoolSubscription(): BelongsTo
    {
        return $this->belongsTo(SchoolSubscription::class);
    }

    public function markSuccessful(array $response = []): void
    {
        $this->update([
            'status' => 'successful',
            'gateway_response' => $response,
            'paid_at' => now(),
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => 'failed',
            'failure_reason' => $reason,
        ]);
    }

    public function markRefunded(): void
    {
        $this->update([
            'status' => 'refunded',
            'is_refunded' => true,
        ]);
    }

    public function isSuccessful(): bool
    {
        return $this->status === 'successful';
    }
}
