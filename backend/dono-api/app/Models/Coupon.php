<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    protected $fillable = [

        'name',

        'code',

        'description',

        'discount_type',

        'discount_value',

        'start_date',

        'end_date',

        'maximum_usage',

        'times_used',

        'maximum_usage_per_school',

        'first_time_only',

        'is_active',
    ];

    protected $casts = [

        'start_date' => 'datetime',

        'end_date' => 'datetime',

        'first_time_only' => 'boolean',

        'is_active' => 'boolean',

        'discount_value' => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Plans this coupon can be used on
    |--------------------------------------------------------------------------
    */

    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(
            SubscriptionPlan::class
        )->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Schools allowed to use this coupon
    |--------------------------------------------------------------------------
    */

    public function schools(): BelongsToMany
    {
        return $this->belongsToMany(
            School::class
        )->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function hasExpired(): bool
    {
        return now()->greaterThan($this->end_date);
    }

    public function hasStarted(): bool
    {
        return now()->greaterThanOrEqualTo($this->start_date);
    }

    public function isRunning(): bool
    {
        return $this->is_active
            && $this->hasStarted()
            && ! $this->hasExpired();
    }

    public function canStillBeUsed(): bool
    {
        if (is_null($this->maximum_usage)) {
            return true;
        }

        return $this->times_used < $this->maximum_usage;
    }
}
