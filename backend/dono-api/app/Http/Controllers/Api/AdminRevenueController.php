<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\School;
use App\Models\SchoolSubscription;

class AdminRevenueController extends Controller
{
    /**
     * Software Owner revenue dashboard using reconciled local transaction state.
     */
    public function index()
    {
        $recognized = $this->recognizedQuery();
        $refunded = PaymentTransaction::query()
            ->where(function ($query): void {
                $query->where('status', 'refunded')->orWhere('is_refunded', true);
            });
        $disputed = PaymentTransaction::query()->where('status', 'disputed');
        $reviewQueue = PaymentTransaction::query()->whereIn('reconciliation_status', ['pending', 'review']);
        $grossSuccessful = PaymentTransaction::query()->where('status', 'successful');

        $totalRevenue = (float) $recognized->sum('amount');
        $monthlyRevenue = (float) (clone $recognized)->whereBetween('paid_at', [now()->copy()->startOfMonth(), now()->copy()->endOfMonth()])->sum('amount');
        $yearlyRevenue = (float) (clone $recognized)->whereBetween('paid_at', [now()->copy()->startOfYear(), now()->copy()->endOfYear()])->sum('amount');
        $refundTotal = (float) $refunded->selectRaw('SUM(CASE WHEN refund_amount IS NULL OR refund_amount = 0 THEN amount ELSE refund_amount END) as total')->value('total');
        $disputedTotal = (float) $disputed->sum('amount');

        $activeSubscriptions = SchoolSubscription::where('status', 'active')->count();
        $expiredSubscriptions = SchoolSubscription::where('status', 'expired')->count();
        $expiringSoon = SchoolSubscription::where('status', 'active')->whereDate('expiry_date', '<=', now()->addDays(7))->count();
        $totalSchools = School::count();

        $billingCycleRevenue = (clone $recognized)
            ->selectRaw('billing_cycle, SUM(amount) as total')
            ->groupBy('billing_cycle')
            ->get();

        $recentPayments = PaymentTransaction::with(['school', 'schoolSubscription.subscriptionPlan'])
            ->whereIn('status', ['successful', 'refunded', 'disputed'])
            ->latest('paid_at')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'statistics' => [
                'total_revenue' => $totalRevenue,
                'gross_successful_revenue' => (float) $grossSuccessful->sum('amount'),
                'refund_total' => $refundTotal,
                'disputed_total' => $disputedTotal,
                'monthly_revenue' => $monthlyRevenue,
                'yearly_revenue' => $yearlyRevenue,
                'total_schools' => $totalSchools,
                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
                'expiring_soon' => $expiringSoon,
                'reconciliation_review_queue' => $reviewQueue->count(),
            ],
            'billing_cycle_revenue' => $billingCycleRevenue,
            'recent_payments' => $recentPayments,
        ]);
    }

    private function recognizedQuery()
    {
        return PaymentTransaction::query()
            ->where('status', 'successful')
            ->where(function ($query): void {
                $query->where('is_refunded', false)->orWhereNull('is_refunded');
            });
    }
}
