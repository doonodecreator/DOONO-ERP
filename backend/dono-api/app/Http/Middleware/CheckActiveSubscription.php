<?php

namespace App\Http\Middleware;

use App\Models\SchoolSubscription;
use App\Models\SystemSetting;
use App\Services\CurrentContextService;
use App\Services\SubscriptionAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSubscription
{
    public function __construct(
        private CurrentContextService $context,
        private SubscriptionAccessService $access,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $enforced = (bool) (SystemSetting::first()?->enforce_subscriptions ?? false);

        if (!$enforced || $request->user()?->isSuperAdmin()) {
            return $next($request);
        }

        $user = $request->user();
        $schoolId = $this->context->currentSchool($user)?->id;

        if (!$schoolId) {
            return $next($request);
        }

        $feature = $this->featureForRequest($request);

        // Setup and basic administration remain available so a new school can
        // become operational before selecting a paid plan.
        if (!$feature) {
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
            'status' => $subscription?->status ?? 'unsubscribed',
            'message' => $subscription && $subscription->isActive()
                ? "Your current plan does not include {$this->access->label($feature)}. Upgrade your plan to continue."
                : "An active subscription is required for {$this->access->label($feature)}. Core school setup remains available while you choose a plan.",
            'upgrade_url' => '/dashboard/subscription/upgrade',
        ], 402);
    }

    private function featureForRequest(Request $request): ?string
    {
        $path = trim($request->path(), '/');

        $groups = [
            'fees' => ['fees', 'student-fees', 'fee-payments', 'payment-receipts', 'fee-adjustments', 'payments/paystack'],
            'accounting' => ['expenses', 'financial-reports'],
            'payroll' => ['payroll'],
            'results' => ['results', 'result-entry', 'result-submissions', 'examinations', 'exam-scores', 'assessment-structures', 'promotions', 'graduation-records'],
            'report_cards' => ['report-cards', 'student/report-card', 'parent/report-cards'],
            'cbt' => ['cbt-questions', 'cbt-assessments', 'cbt-attempts', 'assessment-activities', 'student/cbt-assessments', 'student/cbt-attempts', 'student/cbt-questions'],
            'library' => ['library', 'books', 'book-loans', 'student/library'],
            'transport' => ['vehicles', 'transport-routes', 'transport-allocations', 'transport-logs', 'portal/transport-tracking', 'student/transport-tracking'],
            'hostel' => ['hostels', 'hostel-rooms', 'hostel-allocations'],
            'clinic' => ['medical-records', 'clinic-visits'],
            'school_operations' => ['school-events', 'school-facilities', 'visitors', 'gate-passes', 'appointments', 'reception-activities', 'discipline-cases', 'safety-incidents', 'leave-requests', 'student-leave-applications', 'portal/leave-applications', 'student/leave-applications'],
            'inventory' => ['assets', 'asset-register'],
            'sms' => ['sms'],
        ];

        foreach ($groups as $feature => $prefixes) {
            foreach ($prefixes as $prefix) {
                if ($path === "api/v1/{$prefix}" || str_starts_with($path, "api/v1/{$prefix}/")) {
                    return $feature;
                }
            }
        }

        return null;
    }
}
