<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Organization;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class PlatformOwnerController extends Controller
{
    public function dashboard(Request $request)
    {
        $totalOrganizations = Organization::count();
        $totalSchools = School::count();
        $activeSubscriptions = SchoolSubscription::where('status', 'active')->count();

        $organizations = Organization::withCount('schools')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'schools_count' => $org->schools_count,
                'status' => $org->status,
            ]);

        $subscriptionPlans = SubscriptionPlan::withCount('schoolSubscriptions')
            ->get()
            ->map(fn ($plan) => [
                'name' => $plan->name,
                // Plans have per-cycle pricing, not one flat price.
                // Showing monthly as the representative figure here;
                // full pricing (quarterly/half-yearly/yearly) is available
                // via GET /subscription-plans/{id}.
                'monthly_price' => $plan->monthly_price,
                'currency' => $plan->currency,
                'subscribers' => $plan->school_subscriptions_count,
            ]);

        $schoolActivity = ActivityLog::where('is_platform_action', false)
            ->with('user:id,name')
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($log) => [
                'school_id' => $log->school_id,
                'user' => $log->user->name ?? 'System',
                'action' => $log->description ?? "{$log->module}.{$log->action}",
                'time' => $log->created_at->diffForHumans(),
            ]);

        $myOwnActions = ActivityLog::where('is_platform_action', true)
            ->with('user:id,name')
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($log) => [
                'action' => $log->description ?? "{$log->module}.{$log->action}",
                'time' => $log->created_at->diffForHumans(),
            ]);

        return response()->json([
            'system_stats' => [
                'total_organizations' => $totalOrganizations,
                'total_schools' => $totalSchools,
                'active_subscriptions' => $activeSubscriptions,
                // MRR and uptime require billing/monitoring integration not
                // yet confirmed to exist — intentionally omitted rather
                // than fabricated.
            ],
            'organizations' => $organizations,
            'subscription_plans' => $subscriptionPlans,
            'school_activity' => $schoolActivity,
            'my_actions' => $myOwnActions,
        ]);
    }

    public function impersonateUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $currentAdmin = $request->user();

        if (!$currentAdmin->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only Platform Software Owners can perform user impersonation.',
            ], 403);
        }

        $targetUser = User::findOrFail($request->user_id);
        $token = $targetUser->createToken('impersonation-by-owner')->plainTextToken;

        ActivityLogService::log(
            module: 'platform',
            action: 'impersonated_user',
            description: "Impersonated user \"{$targetUser->name}\" ({$targetUser->email})",
            subject: $targetUser,
        );

        return response()->json([
            'success' => true,
            'message' => "Impersonating user '{$targetUser->name}' ({$targetUser->email}).",
            'impersonated_user' => $targetUser,
            'token' => $token,
        ]);
    }
}
