<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolSubscriptionRequest;
use App\Http\Requests\UpdateSchoolSubscriptionRequest;
use App\Http\Resources\SchoolSubscriptionResource;
use App\Models\SchoolSubscription;
use Illuminate\Support\Facades\DB;

class SchoolSubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions.
     */
    public function index()
    {
        return SchoolSubscriptionResource::collection(
            SchoolSubscription::with([
                'school',
                'subscriptionPlan',
            ])
            ->latest()
            ->paginate(10)
        );
    }

    /**
     * Store a newly created subscription.
     */
    public function store(StoreSchoolSubscriptionRequest $request)
    {
        $subscription = DB::transaction(function () use ($request) {

            $data = $request->validated();

            if ($data['is_current']) {

                SchoolSubscription::where(
                    'school_id',
                    $data['school_id']
                )->update([
                    'is_current' => false,
                ]);
            }

            return SchoolSubscription::create($data);
        });

        return (new SchoolSubscriptionResource(
            $subscription->load([
                'school',
                'subscriptionPlan',
            ])
        ))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified subscription.
     */
    public function show(SchoolSubscription $schoolSubscription)
    {
        return new SchoolSubscriptionResource(
            $schoolSubscription->load([
                'school',
                'subscriptionPlan',
            ])
        );
    }

    /**
     * Update the specified subscription.
     */
    public function update(
        UpdateSchoolSubscriptionRequest $request,
        SchoolSubscription $schoolSubscription
    ) {
        DB::transaction(function () use ($request, $schoolSubscription) {

            $data = $request->validated();

            if (
                isset($data['is_current']) &&
                $data['is_current'] === true
            ) {

                SchoolSubscription::where(
                    'school_id',
                    $schoolSubscription->school_id
                )->update([
                    'is_current' => false,
                ]);
            }

            $schoolSubscription->update($data);
        });

        return new SchoolSubscriptionResource(
            $schoolSubscription->fresh()->load([
                'school',
                'subscriptionPlan',
            ])
        );
    }

    /**
     * Remove the specified subscription.
     */
    public function destroy(SchoolSubscription $schoolSubscription)
    {
        $schoolSubscription->delete();

        return response()->json([
            'message' => 'Subscription deleted successfully.'
        ]);
    }
}
