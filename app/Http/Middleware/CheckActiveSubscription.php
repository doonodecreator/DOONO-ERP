<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $schoolId =
            $request->input('school_id') ??
            $request->route('school_id') ??
            $request->header('X-School-Id');

        if (!$schoolId) {
            return response()->json([
                'success' => false,
                'message' => 'School ID is required.',
            ], 400);
        }

        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No active subscription found.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Automatically expire subscriptions
        |--------------------------------------------------------------------------
        */

        if (
            $subscription->expiry_date &&
            now()->greaterThan($subscription->expiry_date)
        ) {
            $subscription->update([
                'status' => 'expired',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Your subscription has expired. Please renew to continue.',
                'expired_at' => $subscription->expiry_date,
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Subscription manually suspended/cancelled
        |--------------------------------------------------------------------------
        */

        if ($subscription->status !== 'active' && $subscription->status !== 'trial') {
            return response()->json([
                'success' => false,
                'message' => 'Your subscription is currently unavailable.',
                'status' => $subscription->status,
            ], 403);
        }

        return $next($request);
    }
}
