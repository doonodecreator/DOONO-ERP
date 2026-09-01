<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionPlanRequest;
use App\Http\Requests\UpdateSubscriptionPlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return SubscriptionPlanResource::collection(
            SubscriptionPlan::latest()->paginate(10)
        );
    }

    /**
     * Store a newly created resource.
     */
    public function store(StoreSubscriptionPlanRequest $request)
    {
        $plan = SubscriptionPlan::create(
            $request->validated()
        );

        return (new SubscriptionPlanResource($plan))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return new SubscriptionPlanResource(
            $subscriptionPlan
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(
        UpdateSubscriptionPlanRequest $request,
        SubscriptionPlan $subscriptionPlan
    ) {
        $subscriptionPlan->update(
            $request->validated()
        );

        return new SubscriptionPlanResource(
            $subscriptionPlan
        );
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(
        SubscriptionPlan $subscriptionPlan
    ) {
        $subscriptionPlan->delete();

        return response()->json([
            'message' => 'Subscription plan deleted successfully.'
        ]);
    }
}
