<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionFeature
{
    public function __construct(private CurrentContextService $context)
    {
    }

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $systemSetting = SystemSetting::first();
        if ($systemSetting && !$systemSetting->enforce_subscriptions) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        $resolved = $this->context->resolve($user);
        $schoolId = $resolved['school']['id'] ?? null;

        if (!$schoolId) {
            return $next($request);
        }

        $subscription = SchoolSubscription::with('subscriptionPlan.featureModels')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if ($subscription && $subscription->is_exempt) {
            return $next($request);
        }

        if (!$subscription || !$subscription->isActive()) {
            return response()->json([
                'success' => false,
                'requires_subscription' => true,
                'message' => 'An active subscription plan is required to access this feature.',
                'requested_feature' => $feature,
            ], 402);
        }

        if ($subscription->subscriptionPlan && $subscription->subscriptionPlan->featureModels) {
            $allowed = $subscription->subscriptionPlan->featureModels->contains('slug', $feature);

            if ($allowed) {
                return $next($request);
            }
        }

        $recommendedPlan = SubscriptionPlan::recommendedPlanForFeature($feature);

        return response()->json([
            'success' => false,
            'message' => $recommendedPlan
                ? "Upgrade to the {$recommendedPlan->name} plan to use this feature."
                : "Upgrade your subscription to use this feature.",
            'current_plan' => optional($subscription->subscriptionPlan)->name,
            'recommended_plan' => optional($recommendedPlan)->name,
            'requested_feature' => $feature,
        ], 403);
    }
}
