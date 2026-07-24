<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromoCampaignRequest;
use App\Http\Requests\UpdatePromoCampaignRequest;
use App\Http\Resources\PromoCampaignResource;
use App\Models\PromoCampaign;
use Illuminate\Support\Facades\DB;

class PromoCampaignController extends Controller
{
    /**
     * Display all promo campaigns.
     */
    public function index()
    {
        return PromoCampaignResource::collection(
            PromoCampaign::with('subscriptionPlans')
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a new promo campaign.
     */
    public function store(StorePromoCampaignRequest $request)
    {
        $campaign = DB::transaction(function () use ($request) {

            $data = $request->validated();

            $planIds = $data['subscription_plans'] ?? [];

            unset($data['subscription_plans']);

            $campaign = PromoCampaign::create($data);

            if (!empty($planIds)) {
                $campaign->subscriptionPlans()->sync($planIds);
            }

            return $campaign;
        });

        return (new PromoCampaignResource(
            $campaign->load('subscriptionPlans')
        ))
        ->response()
        ->setStatusCode(201);
    }

    /**
     * Display a single promo campaign.
     */
    public function show(PromoCampaign $promoCampaign)
    {
        return new PromoCampaignResource(
            $promoCampaign->load('subscriptionPlans')
        );
    }

    /**
     * Update promo campaign.
     */
    public function update(
        UpdatePromoCampaignRequest $request,
        PromoCampaign $promoCampaign
    ) {

        DB::transaction(function () use (
            $request,
            $promoCampaign
        ) {

            $data = $request->validated();

            if (isset($data['subscription_plans'])) {

                $promoCampaign
                    ->subscriptionPlans()
                    ->sync($data['subscription_plans']);

                unset($data['subscription_plans']);
            }

            $promoCampaign->update($data);
        });

        return new PromoCampaignResource(
            $promoCampaign
                ->fresh()
                ->load('subscriptionPlans')
        );
    }

    /**
     * Delete campaign.
     */
    public function destroy(PromoCampaign $promoCampaign)
    {
        $promoCampaign->subscriptionPlans()->detach();

        $promoCampaign->delete();

        return response()->json([
            'message' => 'Promo campaign deleted successfully.',
        ]);
    }
}
