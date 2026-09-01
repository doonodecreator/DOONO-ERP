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
        'gateway_event_id',

        'amount',

        'currency',

        'billing_cycle',

        'status',
        'reconciliation_status',

        'gateway_response',

        'paid_at',
        'verified_at',
        'reviewed_by',
        'reviewed_at',
        'reconciliation_notes',

        'failure_reason',

        'is_refunded',
        'refund_id',
        'refund_status',
        'refund_amount',
        'refund_response',
        'refund_reason',
        'refund_requested_by',
        'refund_requested_at',
        'refunded_at',
    ];

    protected $casts = [

        'amount' => 'decimal:2',

        'gateway_response' => 'array',

        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
        'reviewed_at' => 'datetime',

        'is_refunded' => 'boolean',
        'refund_amount' => 'decimal:2',
        'refund_response' => 'array',
        'refund_requested_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function schoolSubscription(): BelongsTo
    {
        return $this->belongsTo(SchoolSubscription::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function refundRequester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refund_requested_by');
    }

    public function markSuccessful(array $response = []): void
    {
        $this->update([
            'status' => 'successful',
            'reconciliation_status' => 'reconciled',
            'gateway_response' => $response,
            'paid_at' => now(),
            'verified_at' => now(),
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => 'failed',
            'reconciliation_status' => 'failed',
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
