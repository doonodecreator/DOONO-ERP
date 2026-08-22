<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Feature extends Model
{
    protected $fillable = [

        'name',

        'slug',

        'description',

        'category',

        'is_active',
    ];

    protected $casts = [

        'is_active' => 'boolean',
    ];

    /**
     * Subscription plans that can access this feature.
     */
    public function subscriptionPlans(): BelongsToMany
    {
        return $this->belongsToMany(
            SubscriptionPlan::class,
            'feature_subscription_plan',
            'feature_id',
            'subscription_plan_id'
        )
        ->withPivot('is_enabled')
        ->withTimestamps();
    }
}
