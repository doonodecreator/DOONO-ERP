<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\School;
use App\Models\SchoolSubscription;

class AdminRevenueController extends Controller
{
    /**
     * DOONO Revenue Dashboard
     */
    public function index()
    {
        $totalRevenue = PaymentTransaction::where(
            'status',
            'successful'
        )->sum('amount');

        $monthlyRevenue = PaymentTransaction::where(
            'status',
            'successful'
        )
        ->whereMonth('paid_at', now()->month)
        ->whereYear('paid_at', now()->year)
        ->sum('amount');

        $yearlyRevenue = PaymentTransaction::where(
            'status',
            'successful'
        )
        ->whereYear('paid_at', now()->year)
        ->sum('amount');

        $activeSubscriptions = SchoolSubscription::where(
            'status',
            'active'
        )->count();

        $expiredSubscriptions = SchoolSubscription::where(
            'status',
            'expired'
        )->count();

        $expiringSoon = SchoolSubscription::where(
            'status',
            'active'
        )
        ->whereDate(
            'expiry_date',
            '<=',
            now()->addDays(7)
        )
        ->count();

        $totalSchools = School::count();
$billingCycleRevenue = PaymentTransaction::selectRaw(
            'billing_cycle, SUM(amount) as total'
        )
        ->where('status', 'successful')
        ->groupBy('billing_cycle')
        ->get();

        $recentPayments = PaymentTransaction::with([
            'school',
            'schoolSubscription.subscriptionPlan'
        ])
        ->where('status', 'successful')
        ->latest('paid_at')
        ->take(10)
        ->get();

        return response()->json([
            'success' => true,

            'statistics' => [
                'total_revenue' => $totalRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'yearly_revenue' => $yearlyRevenue,

                'total_schools' => $totalSchools,

                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
                'expiring_soon' => $expiringSoon,
            ],

            'billing_cycle_revenue' => $billingCycleRevenue,

            'recent_payments' => $recentPayments,
        ]);
    }
}
