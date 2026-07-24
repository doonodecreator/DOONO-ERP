<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PromoCampaign extends Model
{
    protected $fillable = [

        'name',

        'slug',

        'description',

        'discount_type',

        'discount_value',

        'start_date',

        'end_date',

        'maximum_usage',

        'times_used',

        'is_active',

        'auto_activate',
    ];

    protected $casts = [

        'discount_value' => 'decimal:2',

        'start_date' => 'datetime',

        'end_date' => 'datetime',

        'is_active' => 'boolean',

        'auto_activate' => 'boolean',
    ];

    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(
            SubscriptionPlan::class
        )->withTimestamps();
    }

    public function isRunning(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        return now()->between(
            $this->start_date,
            $this->end_date
        );
    }

    public function hasExpired(): bool
    {
        return now()->greaterThan(
            $this->end_date
        );
    }

    public function canStillBeUsed(): bool
    {
        if ($this->maximum_usage === null) {
            return true;
        }

        return $this->times_used < $this->maximum_usage;
    }
}
