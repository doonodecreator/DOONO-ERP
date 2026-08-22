<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\TenantPartitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly TenantPartitionService $tenantPartitions,
    )
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = School::with(['organization', 'owner', 'country']);

        if (!$user->isSuperAdmin()) {
            $query->where('owner_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isSuperAdmin() || $this->context->isOrganizationOwner($user), 403, 'Only the Software Owner or Organization Owner can create a school.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'school_code' => 'required|string|max:50|unique:schools,school_code',
            'school_type' => 'required|string|in:Primary,Secondary,Combined',
            'country_id' => 'required|exists:countries,id',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        $organization = $this->context->currentOrganization($user);

        if (!$organization) {
            return response()->json([
                'success' => false,
                'message' => 'No organization found for this account.',
            ], 422);
        }

        $school = DB::transaction(function () use ($validated, $user, $organization) {
            $school = School::create([
                'organization_id' => $organization->id,
                'owner_id' => $user->id,

                'country_id' => $validated['country_id'],

                'name' => $validated['name'],
                'short_name' => $validated['short_name'] ?? $validated['name'],

                'school_code' => $validated['school_code'],
                'school_type' => $validated['school_type'],

                'has_primary' => $validated['has_primary'] ?? true,
                'has_secondary' => $validated['has_secondary'] ?? false,

                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,

                'status' => 'active',
            ]);

            $this->tenantPartitions->assignDefault($school);

            $proprietorRole = Role::where('slug', 'proprietor')->first();

            if ($proprietorRole) {
                $user->roles()->attach($proprietorRole->id, [
                    'school_id' => $school->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $settings = SystemSetting::first();
            $defaultPlanId = $settings?->default_subscription_plan_id
                ?: SubscriptionPlan::where('is_active', true)->orderBy('id')->value('id');
            $defaultPlan = $defaultPlanId ? SubscriptionPlan::find($defaultPlanId) : null;
            $trialDays = max(0, (int) ($settings?->trial_days ?? 0));
            $startDate = now()->startOfDay();
            $trialEnd = $trialDays > 0 ? $startDate->copy()->addDays($trialDays) : null;

            if ($defaultPlan) {
                SchoolSubscription::create([
                    'school_id' => $school->id,
                    'subscription_plan_id' => $defaultPlan->id,
                    'start_date' => $startDate,
                    'expiry_date' => $trialEnd ?: $startDate,
                    'trial_ends_at' => $trialEnd,
                    'billing_cycle' => 'yearly',
                    'status' => $trialEnd ? 'trial' : 'expired',
                    'amount_paid' => 0,
                    'currency' => strtoupper((string) ($defaultPlan->currency ?: 'NGN')),
                    'is_current' => true,
                    'is_exempt' => false,
                    'auto_renew' => false,
                ]);
            }

            return $school;
        });

        ActivityLogService::log(
            module: 'school',
            action: 'created',
            description: "School \"{$school->name}\" was created",
            subject: $school,
            schoolId: $school->id,
        );

        return response()->json([
            'success' => true,
            'message' => 'School created successfully.',
            'data' => $school->load(['organization', 'owner', 'country']),
        ], 201);
    }

    public function show(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $school->load(['organization', 'owner', 'country']),
        ]);
    }

    public function update(Request $request, School $school)
    {
        if (!$this->userCanAccessSchool($request->user(), $school)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'short_name' => 'nullable|string|max:255',
            'school_code' => 'sometimes|required|string|max:50|unique:schools,school_code,' . $school->id,
            'school_type' => 'sometimes|required|string|in:Primary,Secondary,Combined',
            'country_id' => 'sometimes|required|exists:countries,id',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'has_primary' => 'boolean',
            'has_secondary' => 'boolean',
        ]);

        $changedFields = array_keys($validated);

        $school->update($validated);

        ActivityLogService::log(
            module: 'school',
            action: 'updated',
            description: 'School settings updated (' . implode(', ', $changedFields) . ')',
            subject: $school,
            properties: $validated,
            schoolId: $school->id,
        );

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully.',
            'data' => $school->fresh()->load(['organization', 'owner', 'country']),
        ]);
    }

    public function destroy(Request $request, School $school)
    {
        $user = $request->user();
        abort_unless($this->userCanDeleteSchool($user, $school), 403, 'Only the Software Owner or owning Organization Owner can delete a school.');

        $deleted = $school->toArray();
        $school->delete();

        ActivityLogService::log(
            module: 'school',
            action: 'deleted',
            description: "School \"{$deleted['name']}\" was deleted.",
            schoolId: $school->id,
            properties: ['deleted_school' => $deleted],
        );

        return response()->json([
            'success' => true,
            'message' => 'School deleted successfully.',
        ]);
    }

    public function countries()
    {
        return response()->json([
            'success' => true,
            'data' => Country::orderBy('name')->get(),
        ]);
    }

    public function extendTrial(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'trial_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ]);

        $defaultPlanId = SubscriptionPlan::where('is_active', true)->value('id');
        if (!$defaultPlanId) {
            return response()->json(['success' => false, 'message' => 'Create at least one active subscription plan before extending a trial.'], 422);
        }

        $subscription = SchoolSubscription::firstOrCreate(
            ['school_id' => $school->id, 'is_current' => true],
            [
                'subscription_plan_id' => $defaultPlanId,
                'start_date' => now()->toDateString(),
                'status' => 'trial',
                'currency' => 'USD',
            ]
        );

        $base = $subscription->trial_ends_at && $subscription->trial_ends_at->isFuture()
            ? $subscription->trial_ends_at->copy()
            : now();
        $trialEndsAt = $base->addDays($validated['trial_days'])->endOfDay();

        $subscription->status = 'trial';
        $subscription->trial_ends_at = $trialEndsAt;
        $subscription->expiry_date = $subscription->expiry_date && $subscription->expiry_date->greaterThan($trialEndsAt)
            ? $subscription->expiry_date
            : $trialEndsAt->toDateString();
        $subscription->save();

        ActivityLogService::log(
            module: 'subscription',
            action: 'trial_extended',
            description: "Extended trial for \"{$school->name}\" by {$validated['trial_days']} days.",
            subject: $school,
            schoolId: $school->id,
            properties: ['trial_days' => $validated['trial_days'], 'trial_ends_at' => $trialEndsAt->toDateString()],
        );

        return response()->json([
            'success' => true,
            'message' => 'Trial extended successfully.',
            'data' => $subscription->fresh()->load('subscriptionPlan'),
        ]);
    }

    public function updateSubscriptionStatus(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:trial,active,expired,cancelled'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $subscription = SchoolSubscription::where('school_id', $school->id)
            ->where('is_current', true)
            ->latest('id')
            ->first();

        if (!$subscription) {
            $defaultPlanId = SubscriptionPlan::where('is_active', true)->value('id');
            if (!$defaultPlanId) {
                return response()->json(['success' => false, 'message' => 'Create at least one active subscription plan before changing subscription status.'], 422);
            }
            $subscription = SchoolSubscription::create([
                'school_id' => $school->id,
                'subscription_plan_id' => $defaultPlanId,
                'start_date' => now()->toDateString(),
                'expiry_date' => $validated['expiry_date'] ?: now()->addMonth()->toDateString(),
                'currency' => 'USD',
                'is_current' => true,
            ]);
        }

        $subscription->status = $validated['status'];
        if (!empty($validated['expiry_date'])) {
            $subscription->expiry_date = $validated['expiry_date'];
        }
        if ($validated['status'] === 'cancelled') {
            $subscription->is_current = false;
        }
        $subscription->save();

        ActivityLogService::log(
            module: 'subscription',
            action: 'status_updated',
            description: "Set subscription status to {$validated['status']} for \"{$school->name}\".",
            subject: $school,
            schoolId: $school->id,
            properties: $validated,
        );

        return response()->json([
            'success' => true,
            'message' => 'Subscription status updated successfully.',
            'data' => $subscription->fresh()->load('subscriptionPlan'),
        ]);
    }

    /**
     * Toggle lifetime-free exemption for a school. Records who granted it
     * and when, so exemptions are auditable, not just a silent flag flip.
     */
    public function toggleExemption(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $defaultPlanId = SubscriptionPlan::where('is_active', true)->value('id');
        if (!$defaultPlanId) {
            return response()->json(['success' => false, 'message' => 'Create at least one active subscription plan before granting school access overrides.'], 422);
        }

        $subscription = SchoolSubscription::firstOrCreate(
            ['school_id' => $school->id, 'is_current' => true],
            [
                'subscription_plan_id' => $defaultPlanId,
                'start_date' => now(),
                'expiry_date' => now()->addYears(100),
                'status' => 'active',
                'currency' => 'USD',
            ]
        );

        $subscription->is_exempt = !$subscription->is_exempt;

        if ($subscription->is_exempt) {
            $subscription->exempted_by = $request->user()->id;
            $subscription->exempted_at = now();
        } else {
            $subscription->exempted_by = null;
            $subscription->exempted_at = null;
        }

        $subscription->save();

        ActivityLogService::log(
            module: 'subscription',
            action: $subscription->is_exempt ? 'exemption_granted' : 'exemption_revoked',
            description: ($subscription->is_exempt ? 'Granted' : 'Revoked') . " lifetime-free exemption for \"{$school->name}\"",
            subject: $school,
            schoolId: $school->id,
        );

        return response()->json([
            'success' => true,
            'message' => $subscription->is_exempt
                ? 'School granted free lifetime access.'
                : 'Free lifetime access revoked.',
            'data' => $subscription,
        ]);
    }

    /**
     * Grant a school a custom subscription end date — "free for as long
     * as I want" without permanent exemption.
     */
    public function grantCustomTimeframe(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'expiry_date' => 'required|date|after:today',
        ]);

        $defaultPlanId = SubscriptionPlan::where('is_active', true)->value('id');
        if (!$defaultPlanId) {
            return response()->json(['success' => false, 'message' => 'Create at least one active subscription plan before granting school access overrides.'], 422);
        }

        $subscription = SchoolSubscription::firstOrCreate(
            ['school_id' => $school->id, 'is_current' => true],
            [
                'subscription_plan_id' => $defaultPlanId,
                'start_date' => now(),
                'status' => 'active',
                'currency' => 'USD',
            ]
        );

        $subscription->expiry_date = $validated['expiry_date'];
        $subscription->status = 'active';
        $subscription->discount_percentage = 100;
        $subscription->discount_reason = 'Platform-granted free access period';
        $subscription->discount_ends_at = \Carbon\Carbon::parse($validated['expiry_date'])->endOfDay();
        $subscription->save();

        ActivityLogService::log(
            module: 'subscription',
            action: 'custom_timeframe_granted',
            description: "Set custom access until {$validated['expiry_date']} for \"{$school->name}\"",
            subject: $school,
            properties: $validated,
        );

        return response()->json([
            'success' => true,
            'message' => 'Custom access period set.',
            'data' => $subscription,
        ]);
    }

    /**
     * Set a discount percentage for a school's subscription pricing.
     * Accepts an optional reason (shown in the audit trail) and an
     * optional expiry — a discount with no expiry stays until manually
     * changed.
     */
    public function setDiscount(Request $request, School $school)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'discount_reason' => 'nullable|string|max:1000',
            'discount_ends_at' => 'nullable|date|after:today',
        ]);

        $defaultPlanId = SubscriptionPlan::where('is_active', true)->value('id');
        if (!$defaultPlanId) {
            return response()->json(['success' => false, 'message' => 'Create at least one active subscription plan before changing school billing.'], 422);
        }

        $subscription = SchoolSubscription::firstOrCreate(
            ['school_id' => $school->id, 'is_current' => true],
            [
                'subscription_plan_id' => $defaultPlanId,
                'start_date' => now(),
                'expiry_date' => now()->addYear(),
                'status' => 'active',
                'currency' => 'USD',
            ]
        );

        $subscription->discount_percentage = $validated['discount_percentage'];
        $subscription->discount_reason = $validated['discount_reason'] ?? null;
        $subscription->discount_ends_at = $validated['discount_ends_at'] ?? null;
        $subscription->save();

        ActivityLogService::log(
            module: 'subscription',
            action: 'discount_set',
            description: "Set {$validated['discount_percentage']}% discount for \"{$school->name}\"" .
                (isset($validated['discount_reason']) ? " — {$validated['discount_reason']}" : ''),
            subject: $school,
            properties: $validated,
        );

        return response()->json([
            'success' => true,
            'message' => 'Discount applied.',
            'data' => $subscription,
        ]);
    }

    private function userCanAccessSchool($user, School $school): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ((int) $user->id === (int) $school->owner_id) {
            return true;
        }

        return $user->hasRole('proprietor', (int) $school->id);
    }

    private function userCanDeleteSchool($user, School $school): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return (int) $school->owner_id === (int) $user->id
            && $this->context->isOrganizationOwner($user);
    }
}
