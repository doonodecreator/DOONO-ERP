<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Organization;
use App\Models\PaymentTransaction;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class PlatformOwnerController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function dashboard(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            abort(403, 'Platform metrics are restricted to Software Owners.');
        }

        $totalOrganizations = Organization::count();
        $totalSchools = School::count();
        $activeSubscriptions = SchoolSubscription::where('status', 'active')
            ->where('is_current', true)
            ->whereDate('expiry_date', '>=', now()->toDateString())
            ->count();
        $pendingPayments = PaymentTransaction::where('status', 'pending')->count();
        $failedPayments = PaymentTransaction::where('status', 'failed')->count();

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
                'pending_payments' => $pendingPayments,
                'failed_payments' => $failedPayments,
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
