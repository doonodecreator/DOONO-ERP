<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use App\Models\SystemSetting;
use App\Services\CurrentContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSubscription
{
    protected array $majorProtectedRoutes = [
        'results*',
        'result-entry*',
        'report-cards*',
        'student-promotions*',
        'fee-payments*',
        'student-fees*',
        'expenses*',
    ];

    public function __construct(private CurrentContextService $context)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $systemSetting = SystemSetting::first();
        $enforceSubscriptions = $systemSetting ? (bool) $systemSetting->enforce_subscriptions : false;

        if (!$enforceSubscriptions) {
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

        $subscription = SchoolSubscription::where('school_id', $schoolId)
            ->where('is_current', true)
            ->first();

        if ($subscription && $subscription->isActive()) {
            return $next($request);
        }

        if (!$this->isMajorFeatureRequest($request)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'requires_subscription' => true,
            'message' => 'Your school subscription has expired or requires an active plan to access major value-add features.',
            'status' => $subscription->status ?? 'unsubscribed',
            'upgrade_url' => '/dashboard/subscription/upgrade',
        ], 402);
    }

    protected function isMajorFeatureRequest(Request $request): bool
    {
        foreach ($this->majorProtectedRoutes as $pattern) {
            if ($request->is("api/v1/{$pattern}") || $request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
