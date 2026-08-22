<?php

namespace App\Services;

use App\Models\Feature;
use App\Models\SchoolSubscription;
use Illuminate\Support\Collection;

class SubscriptionAccessService
{
    /**
     * Features available for school setup and basic operation without a paid plan.
     * Paid plans add the feature slugs stored in the feature_subscription_plan pivot.
     */
    public const FREE_FEATURES = [
        'dashboard',
        'school_setup',
        'students',
        'parents',
        'staff',
        'attendance',
        'timetable',
        'assignments',
        'communication',
    ];

    public const FEATURE_LABELS = [
        'dashboard' => 'Dashboard and school overview',
        'school_setup' => 'School setup and academic structure',
        'students' => 'Students and parent records',
        'parents' => 'Parent records and portal linking',
        'staff' => 'Staff records and role invitations',
        'attendance' => 'Attendance',
        'timetable' => 'Timetable',
        'assignments' => 'Assignments',
        'communication' => 'School communication',
        'fees' => 'Fees, invoices, payments, and receipts',
        'results' => 'Results computation, approval, and promotion',
        'report_cards' => 'Official report cards and result downloads',
        'cbt' => 'Computer-based tests and question banks',
        'library' => 'Library and book loans',
        'transport' => 'Transport management and tracking',
        'hostel' => 'Hostel management',
        'clinic' => 'Clinic and medical records',
        'accounting' => 'Expenses, budgets, financial reports, and accounting',
        'payroll' => 'Payroll',
        'inventory' => 'Inventory and assets',
        'sms' => 'SMS notifications',
        'ai_reports' => 'AI reports',
        'school_operations' => 'Events, facilities, and operational records',
    ];

    public function featureCatalog(): array
    {
        $databaseFeatures = Feature::query()
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'description', 'category'])
            ->map(fn (Feature $feature) => [
                'id' => $feature->id,
                'name' => $feature->name,
                'slug' => $feature->slug,
                'description' => $feature->description ?: (self::FEATURE_LABELS[$feature->slug] ?? null),
                'category' => $feature->category,
                'is_free' => in_array($feature->slug, self::FREE_FEATURES, true),
            ]);

        $knownSlugs = $databaseFeatures->pluck('slug')->all();
        $missingRows = collect(self::FEATURE_LABELS)
            ->reject(fn ($label, string $slug) => in_array($slug, $knownSlugs, true))
            ->map(fn ($label, string $slug) => [
                'id' => null,
                'name' => $label,
                'slug' => $slug,
                'description' => $label,
                'category' => in_array($slug, self::FREE_FEATURES, true) ? 'Core access' : 'Paid module',
                'is_free' => in_array($slug, self::FREE_FEATURES, true),
            ])
            ->values();

        return $databaseFeatures->concat($missingRows)->values()->all();
    }

    public function forSubscription(?SchoolSubscription $subscription, bool $enforced): array
    {
        $catalog = collect($this->featureCatalog());
        $planFeatures = $this->planFeatureSlugs($subscription);
        $freeFeatures = collect(self::FREE_FEATURES);
        $isFreeAccess = !$enforced
            || (bool) ($subscription?->is_exempt)
            || (bool) ($subscription?->discount_percentage >= 100 && $subscription?->hasActiveDiscount());

        $available = $isFreeAccess
            ? $catalog->pluck('slug')
            : $freeFeatures->merge($planFeatures)->unique()->values();

        return [
            'enforced' => $enforced,
            'is_free_access' => $isFreeAccess,
            'free_features' => $freeFeatures->values()->all(),
            'plan_features' => $planFeatures->values()->all(),
            'available_features' => $available->values()->all(),
            'locked_features' => $catalog->pluck('slug')->diff($available)->values()->all(),
            'feature_catalog' => $catalog->all(),
        ];
    }

    public function planFeatureSlugs(?SchoolSubscription $subscription): Collection
    {
        if (!$subscription?->subscriptionPlan) {
            return collect();
        }

        $databaseFeatures = $subscription->subscriptionPlan->relationLoaded('featureModels')
            ? $subscription->subscriptionPlan->featureModels
            : $subscription->subscriptionPlan->featureModels()->get();

        $pivotFeatures = $databaseFeatures
            ->filter(fn (Feature $feature) => $feature->pivot?->is_enabled !== false)
            ->pluck('slug');

        $legacyFeatures = collect($subscription->subscriptionPlan->features ?? []);
        $hasWildcard = $legacyFeatures->contains('*') || $pivotFeatures->contains('*');

        if ($hasWildcard) {
            // Premium and legacy wildcard plans must cover the complete catalog,
            // including fallback features that have not yet been seeded as rows.
            return collect($this->featureCatalog())
                ->pluck('slug')
                ->filter()
                ->unique()
                ->values();
        }

        return $pivotFeatures
            ->merge($legacyFeatures)
            ->reject(fn ($slug) => $slug === '*')
            ->unique()
            ->values();
    }

    public function allows(?SchoolSubscription $subscription, string $feature, bool $enforced): bool
    {
        if (!$enforced || in_array($feature, self::FREE_FEATURES, true)) {
            return true;
        }

        if (!$subscription || !$subscription->isActive()) {
            return false;
        }

        if ($subscription->is_exempt || ($subscription->discount_percentage >= 100 && $subscription->hasActiveDiscount())) {
            return true;
        }

        return $this->planFeatureSlugs($subscription)->contains($feature);
    }

    public function label(string $feature): string
    {
        return self::FEATURE_LABELS[$feature] ?? ucwords(str_replace('_', ' ', $feature));
    }
}
