<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeatureRequest;
use App\Http\Requests\UpdateFeatureRequest;
use App\Http\Resources\FeatureResource;
use App\Models\Feature;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class FeatureController extends Controller
{
    public function index(Request $request)
    {
        $query = Feature::query()
            ->withCount(['subscriptionPlans as enabled_plans_count' => fn ($plans) => $plans->where('feature_subscription_plan.is_enabled', true)])
            ->orderBy('category')
            ->orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return FeatureResource::collection($query->paginate(min(max($request->integer('per_page', 50), 1), 100)));
    }

    public function store(StoreFeatureRequest $request)
    {
        $feature = Feature::create($request->validated());

        ActivityLogService::log(
            module: 'features',
            action: 'created',
            description: "Feature {$feature->name} was created.",
            subject: $feature,
            properties: ['slug' => $feature->slug, 'category' => $feature->category],
        );

        return (new FeatureResource($feature->loadCount(['subscriptionPlans as enabled_plans_count' => fn ($plans) => $plans->where('feature_subscription_plan.is_enabled', true)])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Feature $feature)
    {
        return new FeatureResource($feature->load(['subscriptionPlans'])->loadCount(['subscriptionPlans as enabled_plans_count' => fn ($plans) => $plans->where('feature_subscription_plan.is_enabled', true)]));
    }

    public function update(UpdateFeatureRequest $request, Feature $feature)
    {
        $before = $feature->only(['name', 'slug', 'description', 'category', 'is_active']);
        $feature->update($request->validated());

        ActivityLogService::log(
            module: 'features',
            action: 'updated',
            description: "Feature {$feature->name} was updated.",
            subject: $feature,
            properties: ['before' => $before, 'after' => $feature->only(array_keys($before))],
        );

        return new FeatureResource($feature->loadCount(['subscriptionPlans as enabled_plans_count' => fn ($plans) => $plans->where('feature_subscription_plan.is_enabled', true)]));
    }

    public function destroy(Feature $feature)
    {
        $name = $feature->name;
        $feature->delete();

        ActivityLogService::log(
            module: 'features',
            action: 'deleted',
            description: "Feature {$name} was deleted.",
            properties: ['feature_id' => $feature->id, 'name' => $name],
        );

        return response()->json(['message' => 'Feature deleted successfully.']);
    }
}
