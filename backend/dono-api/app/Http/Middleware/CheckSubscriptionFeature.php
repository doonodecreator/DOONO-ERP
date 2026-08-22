<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use App\Models\SystemSetting;
use App\Services\CurrentContextService;
use App\Services\SubscriptionAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionFeature
{
    public function __construct(
        private CurrentContextService $context,
        private SubscriptionAccessService $access,
    ) {
    }

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $enforced = (bool) (SystemSetting::first()?->enforce_subscriptions ?? false);

        if (!$enforced || $request->user()?->isSuperAdmin()) {
            return $next($request);
        }

        $schoolId = $this->context->currentSchool($request->user())?->id;
        if (!$schoolId) {
            return $next($request);
        }

        $subscription = SchoolSubscription::with('subscriptionPlan.featureModels')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->latest('id')
            ->first();

        if ($this->access->allows($subscription, $feature, $enforced)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'requires_subscription' => true,
            'requested_feature' => $feature,
            'requested_feature_label' => $this->access->label($feature),
            'current_plan' => $subscription?->subscriptionPlan?->name,
            'recommended_plan' => $subscription?->subscriptionPlan?->recommendedPlanForFeature($feature)?->name,
            'message' => "Upgrade your subscription to use {$this->access->label($feature)}.",
            'upgrade_url' => '/dashboard/subscription/upgrade',
        ], 402);
    }
}
