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
        'amount_paid',
        'currency',
        'payment_reference',
        'auto_renew',
        'is_current',
        'is_exempt',
        'discount_percentage',
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
        'amount_paid' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'auto_renew' => 'boolean',
        'is_current' => 'boolean',
        'is_exempt' => 'boolean',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && now()->greaterThan($this->expiry_date);
    }

    public function isTrial(): bool
    {
        return $this->status === 'trial'
            && $this->trial_ends_at
            && now()->lessThanOrEqualTo($this->trial_ends_at);
    }

    /**
     * Exemption always wins, regardless of status/dates — that's the
     * point of a lifetime-free toggle.
     */
    public function isActive(): bool
    {
        if ($this->is_exempt) {
            return true;
        }

        return $this->status === 'active' || $this->isTrial();
    }

    public function daysRemaining(): int
    {
        if (!$this->expiry_date) {
            return 0;
        }

        return max(0, now()->diffInDays($this->expiry_date, false));
    }

    /**
     * The plan's price for this subscription's billing cycle, after
     * applying this school's discount (if any).
     */
    public function effectivePrice(): float
    {
        $plan = $this->subscriptionPlan;

        if (!$plan) {
            return 0;
        }

        $priceField = match ($this->billing_cycle) {
            'monthly' => 'monthly_price',
            'quarterly' => 'quarterly_price',
            'half_yearly' => 'half_yearly_price',
            default => 'yearly_price',
        };

        $basePrice = (float) $plan->{$priceField};

        if ($this->discount_percentage) {
            return round($basePrice * (1 - ($this->discount_percentage / 100)), 2);
        }

        return $basePrice;
    }
}
