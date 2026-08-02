<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Http\Resources\SchoolResource;
use App\Models\School;
use App\Models\SubscriptionPlan;
use App\Models\SchoolSubscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    /**
     * Display a listing of schools.
     */
    public function index()
    {
        return SchoolResource::collection(
            School::with([
                'organization',
                'country.currency',
                'subscription.subscriptionPlan',
            ])
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created school.
     */
    public function store(StoreSchoolRequest $request)
    {
        $school = DB::transaction(function () use ($request) {

            // Extract school data excluding trial_days parameter
            $schoolData = $request->safe()->except(['trial_days']);
            $school = School::create($schoolData);

            $premiumPlan = SubscriptionPlan::where(
                'slug',
                'premium'
            )->firstOrFail();

            // Use custom trial days if provided, otherwise default to plan days
            $trialDays = $request->input('trial_days', $premiumPlan->trial_days);
            $today = Carbon::today();
            $expiryDate = $today->copy()->addDays((int) $trialDays);

            SchoolSubscription::create([

                'school_id' => $school->id,

                'subscription_plan_id' => $premiumPlan->id,

                'start_date' => $today,

                'expiry_date' => $expiryDate,

                'trial_ends_at' => $expiryDate,

                'next_billing_date' => $expiryDate,

                'billing_cycle' => 'yearly',

                'status' => 'trial',

                'amount_paid' => 0,

                'currency' => $premiumPlan->currency,

                'payment_reference' => null,

                'auto_renew' => false,

                'is_current' => true,
            ]);

            return $school;
        });

        return (new SchoolResource(
            $school->load([
                'organization',
                'country.currency',
                'subscription.subscriptionPlan',
            ])
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified school.
     */
    public function show(School $school)
    {
        return new SchoolResource(
            $school->load([
                'organization',
                'country.currency',
                'subscription.subscriptionPlan',
            ])
        );
    }

    /**
     * Update the specified school.
     */
    public function update(UpdateSchoolRequest $request, School $school)
    {
        $school->update($request->validated());

        return new SchoolResource(
            $school->load([
                'organization',
                'country.currency',
                'subscription.subscriptionPlan',
            ])
        );
    }

    /**
     * Remove the specified school.
     */
    public function destroy(School $school)
    {
        $school->delete();

        return response()->json([
            'message' => 'School deleted successfully.'
        ]);
    }

    /**
     * Super Admin endpoint to extend or adjust a school's trial days.
     */
    public function extendTrial(Request $request, School $school)
    {
        $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        $subscription = $school->subscription;

        if (!$subscription) {
            return response()->json(['message' => 'No active subscription found for this school.'], 404);
        }

        $extraDays = (int) $request->input('days');
        
        // If already expired, extend from today; otherwise extend from existing expiry date
        $baseDate = ($subscription->expiry_date && $subscription->expiry_date->isFuture()) 
            ? $subscription->expiry_date 
            : Carbon::today();

        $newExpiry = $baseDate->copy()->addDays($extraDays);

        $subscription->update([
            'expiry_date' => $newExpiry,
            'trial_ends_at' => $newExpiry,
            'next_billing_date' => $newExpiry,
            'status' => 'trial',
        ]);

        return response()->json([
            'message' => "Trial extended by {$extraDays} days successfully.",
            'subscription' => $subscription->fresh(['subscriptionPlan']),
        ]);
    }

    /**
     * Super Admin endpoint to manually activate, suspend, or update subscription status.
     */
    public function updateSubscriptionStatus(Request $request, School $school)
    {
        $request->validate([
            'status' => 'required|in:active,trial,expired,suspended,cancelled',
        ]);

        $subscription = $school->subscription;

        if (!$subscription) {
            return response()->json(['message' => 'No active subscription found for this school.'], 404);
        }

        $subscription->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'message' => 'Subscription status updated successfully.',
            'subscription' => $subscription->fresh(['subscriptionPlan']),
        ]);
    }
}

