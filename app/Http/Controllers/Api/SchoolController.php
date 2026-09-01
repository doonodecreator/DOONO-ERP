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

            $school = School::create(
                $request->validated()
            );

            $premiumPlan = SubscriptionPlan::where(
                'slug',
                'premium'
            )->firstOrFail();

            $today = Carbon::today();

            SchoolSubscription::create([

                'school_id' => $school->id,

                'subscription_plan_id' => $premiumPlan->id,

                'start_date' => $today,

                'expiry_date' => $today->copy()->addDays(
                    $premiumPlan->trial_days
                ),

                'trial_ends_at' => $today->copy()->addDays(
                    $premiumPlan->trial_days
                ),

                'next_billing_date' => $today->copy()->addDays(
                    $premiumPlan->trial_days
                ),

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
}
