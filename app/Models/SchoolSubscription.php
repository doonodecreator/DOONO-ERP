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

        'auto_renew' => 'boolean',

        'is_current' => 'boolean',
    ];

    /**
     * School that owns this subscription.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Subscription plan.
     */
    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    /**
     * Check whether the subscription has expired.
     */
    public function isExpired(): bool
    {
        return $this->expiry_date
            && now()->greaterThan($this->expiry_date);
    }

    /**
     * Check whether the subscription is still in trial.
     */
    public function isTrial(): bool
    {
        return $this->status === 'trial'
            && $this->trial_ends_at
            && now()->lessThanOrEqualTo($this->trial_ends_at);
    }

    /**
     * Check whether the subscription is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active'
            || $this->isTrial();
    }

    /**
     * Number of days remaining before expiry.
     */
    public function daysRemaining(): int
    {
        if (!$this->expiry_date) {
            return 0;
        }

        return max(
            0,
            now()->diffInDays($this->expiry_date, false)
        );
    }
}
