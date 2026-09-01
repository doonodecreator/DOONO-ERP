<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionFeature
{
    /**
     * Handle an incoming request.
     */
    public function handle(
        Request $request,
        Closure $next,
        string $feature
    ): Response {

        $schoolId = $request->school_id
            ?? $request->route('school_id')
            ?? $request->input('school_id');

        if (!$schoolId) {

            return response()->json([
                'success' => false,
                'message' => 'School ID is required.'
            ], 400);
        }

        $subscription = SchoolSubscription::with(
            'subscriptionPlan.featureModels'
        )
        ->where('school_id', $schoolId)
        ->where('is_current', true)
        ->first();

        if (!$subscription) {

            return response()->json([
                'success' => false,
                'message' => 'No active subscription found. Please subscribe to continue.'
            ], 403);
        }

        if (!$subscription->isActive()) {

            return response()->json([
                'success' => false,
                'message' => 'Your subscription has expired. Please renew your subscription.',
                'current_plan' => optional($subscription->subscriptionPlan)->name
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Check feature using the new database-driven system.
        |--------------------------------------------------------------------------
        */

        $allowed = $subscription->subscriptionPlan
            ->featureModels
            ->contains('slug', $feature);

        if ($allowed) {
            return $next($request);
        }

        $recommendedPlan = SubscriptionPlan::recommendedPlanForFeature($feature);

        return response()->json([
            'success' => false,
            'message' => $recommendedPlan
                ? "Upgrade to the {$recommendedPlan->name} plan to use this feature."
                : "Upgrade your subscription to use this feature.",
            'current_plan' => optional($subscription->subscriptionPlan)->name,
            'recommended_plan' => optional($recommendedPlan)->name,
            'requested_feature' => $feature
        ], 403);
    }
}
