<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SchoolSubscriptionResource;
use App\Models\SchoolSubscription;
use App\Models\SystemSetting;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\SubscriptionAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolSubscriptionController extends Controller
{
    public function __construct(
        private CurrentContextService $context,
        private SubscriptionAccessService $access
    ) {
    }

    /**
     * Platform owner only.
     *
     * Returns all school subscriptions.
     */
    public function index(Request $request)
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
     * Platform owner only.
     *
     * Create a subscription for a school.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'subscription_plan_id' => ['required', 'exists:subscription_plans,id'],

            'start_date' => ['required', 'date'],
            'expiry_date' => [
                'required',
                'date',
                'after_or_equal:start_date',
            ],

            'trial_ends_at' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'next_billing_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'billing_cycle' => [
                'required',
                'in:monthly,quarterly,half_yearly,yearly',
            ],

            'status' => [
                'required',
                'in:trial,active,expired,cancelled',
            ],

            'is_exempt' => ['sometimes', 'boolean'],

            'discount_percentage' => [
                'sometimes',
                'integer',
                'min:0',
                'max:100',
            ],

            'discount_reason' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'discount_ends_at' => [
                'nullable',
                'date',
            ],

            'discount_ends_on' => [
                'nullable',
                'date',
            ],

            'amount_paid' => [
                'required',
                'numeric',
                'min:0',
            ],

            'currency' => [
                'required',
                'string',
                'max:10',
            ],

            'payment_reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'auto_renew' => [
                'required',
                'boolean',
            ],

            'is_current' => [
                'required',
                'boolean',
            ],
        ]);

        $subscription = DB::transaction(
            function () use ($validated) {

                if ($validated['is_current']) {
                    SchoolSubscription::where(
                        'school_id',
                        $validated['school_id']
                    )->update([
                        'is_current' => false,
                    ]);
                }

                return SchoolSubscription::create($validated);
            }
        );

        ActivityLogService::log(
            module: 'school_subscriptions',
            action: 'created',
            description: "Subscription was created for school {$subscription->school_id}.",
            subject: $subscription,
            properties: ['changed_fields' => array_keys($validated)],
            schoolId: $subscription->school_id,
        );

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
     * Platform owner only.
     *
     * Show a specific subscription.
     */
    public function show(
        SchoolSubscription $schoolSubscription
    ) {
        return new SchoolSubscriptionResource(
            $schoolSubscription->load([
                'school',
                'subscriptionPlan',
            ])
        );
    }

    /**
     * Platform owner only.
     *
     * Update a subscription.
     */
    public function update(
        Request $request,
        SchoolSubscription $schoolSubscription
    ) {
        $validated = $request->validate([
            'school_id' => [
                'sometimes',
                'exists:schools,id',
            ],

            'subscription_plan_id' => [
                'sometimes',
                'exists:subscription_plans,id',
            ],

            'start_date' => [
                'sometimes',
                'date',
            ],

            'expiry_date' => [
                'sometimes',
                'date',
            ],

            'trial_ends_at' => [
                'nullable',
                'date',
            ],

            'next_billing_date' => [
                'nullable',
                'date',
            ],

            'billing_cycle' => [
                'sometimes',
                'in:monthly,quarterly,half_yearly,yearly',
            ],

            'status' => [
                'sometimes',
                'in:trial,active,expired,cancelled',
            ],

            'is_exempt' => [
                'sometimes',
                'boolean',
            ],

            'discount_percentage' => [
                'sometimes',
                'integer',
                'min:0',
                'max:100',
            ],

            'discount_reason' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'discount_ends_at' => [
                'nullable',
                'date',
            ],

            'discount_ends_on' => [
                'nullable',
                'date',
            ],

            'amount_paid' => [
                'sometimes',
                'numeric',
                'min:0',
            ],

            'currency' => [
                'sometimes',
                'string',
                'max:10',
            ],

            'payment_reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'auto_renew' => [
                'sometimes',
                'boolean',
            ],

            'is_current' => [
                'sometimes',
                'boolean',
            ],
        ]);

        DB::transaction(
            function () use ($validated, $schoolSubscription) {

                $schoolId = $validated['school_id']
                    ?? $schoolSubscription->school_id;

                if (
                    isset($validated['is_current']) &&
                    $validated['is_current'] === true
                ) {
                    SchoolSubscription::where(
                        'school_id',
                        $schoolId
                    )
                        ->where(
                            'id',
                            '!=',
                            $schoolSubscription->id
                        )
                        ->update([
                            'is_current' => false,
                        ]);
                }

                $schoolSubscription->update($validated);
            }
        );

        ActivityLogService::log(
            module: 'school_subscriptions',
            action: 'updated',
            description: "Subscription for school {$schoolSubscription->school_id} was updated.",
            subject: $schoolSubscription,
            properties: ['changed_fields' => array_keys($validated)],
            schoolId: $schoolSubscription->school_id,
        );

        return new SchoolSubscriptionResource(
            $schoolSubscription
                ->fresh()
                ->load([
                    'school',
                    'subscriptionPlan',
                ])
        );
    }

    /**
     * Platform owner only.
     *
     * Delete a subscription.
     */
    public function destroy(
        SchoolSubscription $schoolSubscription
    ) {
        $schoolId = $schoolSubscription->school_id;
        $subscriptionId = $schoolSubscription->id;
        $schoolSubscription->delete();

        ActivityLogService::log(
            module: 'school_subscriptions',
            action: 'deleted',
            description: "Subscription {$subscriptionId} for school {$schoolId} was deleted.",
            properties: ['subscription_id' => $subscriptionId],
            schoolId: $schoolId,
        );

        return response()->json([
            'message' => 'Subscription deleted successfully.',
        ]);
    }

    /**
     * School/proprietor endpoint.
     *
     * Returns ONLY the subscription belonging to the
     * authenticated user's current school.
     *
     * Super admins may also use this endpoint.
     */
    public function mySubscription(Request $request)
    {
        $user = $request->user();

        $school = $this->context->currentSchool($user);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'No school is associated with this account.',
            ], 404);
        }

        $platformFreeAccess = !(bool) (SystemSetting::first()?->enforce_subscriptions ?? false);

        $subscription = SchoolSubscription::with(
            'subscriptionPlan'
        )
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->latest('id')
            ->first();

        if ($subscription
            && $subscription->status === 'pending'
            && !$subscription->payment_reference
            && !DB::table('payment_transactions')
                ->where('school_subscription_id', $subscription->id)
                ->where('status', 'pending')
                ->exists()
        ) {
            $subscription->update(['status' => 'expired']);
            $subscription->refresh();
        }

        if (!$subscription) {
            return response()->json([
                'success' => true,
                'data' => null,
                'access' => [
                    ...$this->access->forSubscription(null, $platformFreeAccess === false),
                    'platform_free_access' => $platformFreeAccess,
                    'school_free_access' => false,
                ],
                'message' => 'No active subscription has been assigned to this school yet.',
            ]);
        }

        $schoolFreeAccess = $subscription->is_exempt
            || ($subscription->discount_percentage >= 100 && $subscription->hasActiveDiscount());
        $effectiveStatus = in_array($subscription->status, ['active', 'trial'], true)
            && ! $subscription->isActive()
            ? 'expired'
            : $subscription->status;

        return response()->json([
            'success' => true,

            'access' => [
                ...$this->access->forSubscription($subscription, $platformFreeAccess === false),
                'platform_free_access' => $platformFreeAccess,
                'school_free_access' => $schoolFreeAccess,
            ],

            'data' => [
                'id' => $subscription->id,

                'school_id' => $subscription->school_id,

                'plan' => [
                    'id' => $subscription->subscriptionPlan?->id,
                    'name' => $subscription->subscriptionPlan?->name,
                    'description' => $subscription->subscriptionPlan?->description,
                    'features' => $this->access->planFeatureSlugs($subscription)->values()->all(),
                ],

                'billing_cycle' => $subscription->billing_cycle,

                'amount_due' => $subscription->effectivePrice(),

                'currency' => $subscription->currency
                    ?: $subscription->subscriptionPlan?->currency,

                'amount_paid' => $subscription->amount_paid,

                'start_date' => $subscription->start_date,

                'expiry_date' => $subscription->expiry_date,

                'trial_ends_at' => $subscription->trial_ends_at,

                'next_billing_date' => $subscription->next_billing_date,

                'status' => $effectiveStatus,

                'is_current' => $subscription->is_current,

                'is_exempt' => $subscription->is_exempt,
                'is_free_access' => $schoolFreeAccess,
                'free_access_until' => $subscription->is_exempt ? null : $subscription->discount_ends_at,

                'discount_percentage' =>
                    $subscription->discount_percentage,

                'days_remaining' =>
                    $subscription->daysRemaining(),

                'is_active' =>
                    $subscription->isActive(),

                'payment_reference' =>
                    $subscription->payment_reference,
            ],
        ]);
    }
}
