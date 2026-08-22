<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [

        'name',
        'slug',
        'description',

        'monthly_price',
        'quarterly_price',
        'half_yearly_price',
        'yearly_price',

        'currency',

        'max_students',
        'max_staff',
        'max_branches',

        /*
        |--------------------------------------------------------------------------
        | Legacy JSON features
        | Will be removed after full migration.
        |--------------------------------------------------------------------------
        */
        'features',

        'trial_days',

        'is_active',
    ];

    protected $casts = [

        'monthly_price' => 'decimal:2',
        'quarterly_price' => 'decimal:2',
        'half_yearly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',

        'features' => 'array',

        'is_active' => 'boolean',
    ];

    /**
     * School subscriptions.
     */
    public function schoolSubscriptions(): HasMany
    {
        return $this->hasMany(SchoolSubscription::class);
    }

    /**
     * Features attached to this plan.
     */
    public function featureModels(): BelongsToMany
    {
        return $this->belongsToMany(
            Feature::class,
            'feature_subscription_plan',
            'subscription_plan_id',
            'feature_id'
        )
        ->withPivot('is_enabled')
        ->withTimestamps();
    }

    /**
     * Legacy feature check.
     * This will be replaced by the database-driven feature system.
     */
    public function hasFeature(string $feature): bool
    {
        $features = $this->features ?? [];

        return in_array('*', $features)
            || in_array($feature, $features);
    }

    /**
     * Find the minimum plan supporting a feature.
     */
    public static function recommendedPlanForFeature(string $feature): ?self
    {
        $plans = self::with(['featureModels' => fn ($query) => $query->wherePivot('is_enabled', true)])
            ->where('is_active', true)
            ->orderByRaw("
                CASE slug
                    WHEN 'basic' THEN 1
                    WHEN 'standard' THEN 2
                    WHEN 'premium' THEN 3
                    ELSE 99
                END
            ")
            ->get();

        foreach ($plans as $plan) {
            $pivotSlugs = $plan->featureModels->pluck('slug');
            $legacyFeatures = collect($plan->features ?? []);

            if ($legacyFeatures->contains('*') || $pivotSlugs->contains('*') || $pivotSlugs->contains($feature) || $legacyFeatures->contains($feature)) {
                return $plan;
            }
        }

        return null;
    }

    public function isPremium(): bool
    {
        return $this->slug === 'premium';
    }

    public function isStandard(): bool
    {
        return $this->slug === 'standard';
    }

    public function isBasic(): bool
    {
        return $this->slug === 'basic';
    }
}
