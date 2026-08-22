<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSubscriptionPlanRequest;
use App\Http\Requests\UpdateSubscriptionPlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\DB;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        return SubscriptionPlanResource::collection(
            SubscriptionPlan::with(['featureModels' => fn ($query) => $query->wherePivot('is_enabled', true)])
                ->latest()
                ->paginate(10)
        );
    }

    public function store(StoreSubscriptionPlanRequest $request)
    {
        $validated = $request->validated();
        $featureIds = array_values($validated['feature_ids'] ?? []);
        unset($validated['feature_ids']);

        $plan = DB::transaction(function () use ($validated, $featureIds) {
            $plan = SubscriptionPlan::create($validated);
            $plan->featureModels()->syncWithPivotValues($featureIds, ['is_enabled' => true]);

            return $plan->load(['featureModels' => fn ($query) => $query->wherePivot('is_enabled', true)]);
        });

        ActivityLogService::log(
            module: 'subscription_plans',
            action: 'created',
            description: "Subscription plan \"{$plan->name}\" was created.",
            subject: $plan,
            properties: ['plan_id' => $plan->id, 'feature_ids' => $featureIds],
        );

        return (new SubscriptionPlanResource($plan))
            ->response()
            ->setStatusCode(201);
    }

    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return new SubscriptionPlanResource($subscriptionPlan->load(['featureModels' => fn ($query) => $query->wherePivot('is_enabled', true)]));
    }

    public function update(
        UpdateSubscriptionPlanRequest $request,
        SubscriptionPlan $subscriptionPlan
    ) {
        $validated = $request->validated();
        $featureIdsProvided = array_key_exists('feature_ids', $validated);
        $featureIds = array_values($validated['feature_ids'] ?? []);
        unset($validated['feature_ids']);

        DB::transaction(function () use ($validated, $featureIdsProvided, $featureIds, $subscriptionPlan) {
            $subscriptionPlan->update($validated);

            if ($featureIdsProvided) {
                $subscriptionPlan->featureModels()->syncWithPivotValues($featureIds, ['is_enabled' => true]);
            }
        });

        $subscriptionPlan->load(['featureModels' => fn ($query) => $query->wherePivot('is_enabled', true)]);

        ActivityLogService::log(
            module: 'subscription_plans',
            action: 'updated',
            description: "Subscription plan \"{$subscriptionPlan->name}\" was updated.",
            subject: $subscriptionPlan,
            properties: [
                'changed_fields' => array_keys($validated),
                ...($featureIdsProvided ? ['feature_ids' => $featureIds] : []),
            ],
        );

        return new SubscriptionPlanResource($subscriptionPlan);
    }

    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $planId = $subscriptionPlan->id;
        $planName = $subscriptionPlan->name;

        DB::transaction(function () use ($subscriptionPlan) {
            $subscriptionPlan->featureModels()->detach();
            $subscriptionPlan->delete();
        });

        ActivityLogService::log(
            module: 'subscription_plans',
            action: 'deleted',
            description: "Subscription plan \"{$planName}\" was deleted.",
            properties: ['plan_id' => $planId],
        );

        return response()->json([
            'message' => 'Subscription plan deleted successfully.',
        ]);
    }
}
