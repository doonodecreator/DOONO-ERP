<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolSubscription extends Model
{
    protected $fillable = [
        'school_id',
        'subscription_plan_id',

        'start_date',
        'expiry_date',
        'trial_ends_at',
        'next_billing_date',

        'billing_cycle',
        'status',

        'is_exempt',

        'discount_percentage',
        'discount_reason',
        'discount_ends_at',
        'discount_ends_on',

        'amount_paid',
        'currency',
        'payment_reference',

        'auto_renew',
        'is_current',

        'exempted_by',
        'exempted_at',

        'first_reminder_sent_at',
        'second_reminder_sent_at',
        'final_reminder_sent_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expiry_date' => 'date',
        'trial_ends_at' => 'date',
        'next_billing_date' => 'date',

        'first_reminder_sent_at' => 'datetime',
        'second_reminder_sent_at' => 'datetime',
        'final_reminder_sent_at' => 'datetime',

        'discount_ends_at' => 'datetime',
        'discount_ends_on' => 'date',

        'exempted_at' => 'datetime',

        'amount_paid' => 'decimal:2',

        'auto_renew' => 'boolean',
        'is_current' => 'boolean',
        'is_exempt' => 'boolean',

        'discount_percentage' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function exemptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'exempted_by');
    }

    public function isExpired(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        return now()->greaterThan($this->expiry_date);
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial'
            && $this->trial_ends_at
            && now()->lessThanOrEqualTo($this->trial_ends_at);
    }

    public function isActive(): bool
    {
        if ($this->is_exempt) {
            return true;
        }

        return $this->status === 'active'
            || $this->isTrial();
    }

    public function daysRemaining(): int
    {
        if (!$this->expiry_date) {
            return 0;
        }

        return max(
            0,
            now()->diffInDays(
                $this->expiry_date,
                false
            )
        );
    }

    public function hasActiveDiscount(): bool
    {
        if ($this->discount_percentage <= 0) {
            return false;
        }

        if (
            $this->discount_ends_at &&
            now()->greaterThan($this->discount_ends_at)
        ) {
            return false;
        }

        if (
            $this->discount_ends_on &&
            now()->greaterThan($this->discount_ends_on)
        ) {
            return false;
        }

        return true;
    }

    public function basePrice(): float
    {
        if (!$this->subscriptionPlan) {
            return 0.0;
        }

        return match ($this->billing_cycle) {
            'monthly' => (float) $this->subscriptionPlan->monthly_price,

            'quarterly' => (float) $this->subscriptionPlan->quarterly_price,

            'half_yearly' => (float) $this->subscriptionPlan->half_yearly_price,

            'yearly' => (float) $this->subscriptionPlan->yearly_price,

            default => 0.0,
        };
    }

    public function discountAmount(float $price): float
    {
        if (!$this->hasActiveDiscount()) {
            return 0.0;
        }

        return round(
            $price * (
                $this->discount_percentage / 100
            ),
            2
        );
    }

    public function discountedPrice(float $price): float
    {
        return max(
            0,
            round(
                $price - $this->discountAmount($price),
                2
            )
        );
    }

    public function effectivePrice(): float
    {
        if ($this->is_exempt) {
            return 0.0;
        }

        return $this->discountedPrice(
            $this->basePrice()
        );
    }
}
