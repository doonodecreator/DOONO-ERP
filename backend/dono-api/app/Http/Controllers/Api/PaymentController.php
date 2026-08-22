<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeePaymentTransaction;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\StudentFee;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Services\CurrentContextService;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly PaymentService $paymentService,
    ) {
    }

    public function initialize(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'amount' => ['required', 'numeric', 'min:100'],
            'fee_category_id' => ['required', 'integer', 'exists:fee_categories,id'],
            'student_fee_id' => ['nullable', 'integer', 'exists:student_fees,id'],
        ]);

        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'Select an active school before starting a fee payment.');

        $studentFeeQuery = StudentFee::with(['studentEnrollment.student.user'])
            ->when($data['student_fee_id'] ?? null, fn ($query, $studentFeeId) => $query->whereKey($studentFeeId), fn ($query) => $query->where('fee_category_id', $data['fee_category_id']))
            ->whereHas('studentEnrollment', function ($query) use ($schoolId, $data) {
                $query->where('school_id', $schoolId)
                    ->whereHas('student', fn ($student) => $student->whereKey($data['student_id']));
            });
        $studentFee = $studentFeeQuery->latest('id')->first();

        abort_unless($studentFee, 404, 'The selected student fee does not belong to the active school.');
        $amount = round((float) $data['amount'], 2);
        $balance = round((float) $studentFee->balance, 2);
        abort_unless($amount > 0 && $amount <= $balance, 422, 'Payment amount must not exceed the outstanding fee balance.');

        $existing = FeePaymentTransaction::where('school_id', $schoolId)
            ->where('student_fee_id', $studentFee->id)
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(24))
            ->latest()
            ->first();
        $existingAuthorizationUrl = is_array($existing?->gateway_response)
            ? ($existing->gateway_response['authorization_url'] ?? null)
            : null;
        if ($existingAuthorizationUrl) {
            return response()->json(['success' => true, 'message' => 'A payment is already pending. Resume the existing checkout.', 'data' => ['authorization_url' => $existingAuthorizationUrl, 'reference' => $existing->reference, 'resumed' => true]]);
        }

        $schoolSettings = DB::table('school_settings')->where('school_id', $schoolId)->first();
        $secretKey = $schoolSettings->paystack_secret_key ?? config('services.paystack.secret_key');
        abort_unless($secretKey, 422, 'Payment gateway is not configured for this school.');

        $reference = 'DONO_FEE_' . Str::upper(Str::random(24));
        $callbackUrl = rtrim((string) (config('app.frontend_url') ?: $request->getSchemeAndHttpHost()), '/') . '/payment-callback?reference=' . $reference;
        $currency = strtoupper((string) config('services.paystack.currency', 'NGN'));
        $payload = [
            'email' => $studentFee->studentEnrollment?->student?->user?->email ?: 'payments@donoerp.com',
            'amount' => (int) round($amount * 100),
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => ['payment_type' => 'school_fee', 'school_id' => $schoolId, 'student_fee_id' => $studentFee->id, 'student_id' => $data['student_id'], 'fee_category_id' => $data['fee_category_id']],
        ];
        if ($schoolSettings->paystack_subaccount_code ?? null) $payload['subaccount'] = $schoolSettings->paystack_subaccount_code;
        $response = Http::withToken($secretKey)->timeout(30)->post(rtrim((string) config('services.paystack.payment_url', 'https://api.paystack.co'), '/') . '/transaction/initialize', $payload);
        $gateway = $response->json();
        $authorizationUrl = $gateway['data']['authorization_url'] ?? null;

        if (! $response->successful() || ! $authorizationUrl) {
            return response()->json(['success' => false, 'message' => $gateway['message'] ?? 'Paystack could not initialize the fee payment.'], 502);
        }

        $transaction = FeePaymentTransaction::create([
            'school_id' => $schoolId,
            'student_fee_id' => $studentFee->id,
            'gateway' => 'paystack',
            'reference' => $reference,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'pending',
            'gateway_response' => ['authorization_url' => $authorizationUrl, 'metadata' => $payload['metadata']],
        ]);

        return response()->json(['success' => true, 'data' => ['authorization_url' => $authorizationUrl, 'reference' => $transaction->reference]]);
    }

    public function verify(Request $request, string $reference)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        abort_unless($schoolId, 403, 'Select an active school before verifying a fee payment.');
        $transaction = FeePaymentTransaction::where('school_id', $schoolId)->where('reference', $reference)->first();
        abort_unless($transaction, 404, 'Payment transaction not found for the active school.');

        if ($transaction->status === 'successful') {
            return response()->json(['success' => true, 'message' => 'Payment was already verified.', 'data' => ['reference' => $reference, 'status' => 'successful']]);
        }

        $schoolSettings = DB::table('school_settings')->where('school_id', $schoolId)->first();
        $secretKey = $schoolSettings->paystack_secret_key ?? config('services.paystack.secret_key');
        abort_unless($secretKey, 422, 'Payment gateway is not configured for this school.');
        $response = Http::withToken($secretKey)->timeout(30)->get('https://api.paystack.co/transaction/verify/' . rawurlencode($reference));
        $gatewayData = $response->json()['data'] ?? [];
        if (! $response->successful() || ($gatewayData['status'] ?? null) !== 'success') {
            return response()->json(['success' => false, 'message' => 'Payment has not been confirmed as successful.'], 400);
        }
        abort_unless((int) ($gatewayData['amount'] ?? 0) === (int) round((float) $transaction->amount * 100), 422, 'Verified amount does not match the pending fee payment.');

        $this->settleFeePaymentTransaction($transaction, $gatewayData);
        return response()->json(['success' => true, 'message' => 'Payment verified and the fee ledger was updated.', 'data' => ['reference' => $reference, 'status' => 'successful']]);
    }

    public function initializeSubscription(Request $request)
    {
        $data = $request->validate([
            'subscription_plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'billing_cycle' => ['required', 'in:monthly,quarterly,half_yearly,yearly'],
        ]);

        $user = $request->user();
        $schoolId = $this->context->currentSchool($user)?->id;
        $school = $schoolId ? School::find($schoolId) : null;
        if (!$school) return response()->json(['success' => false, 'message' => 'Select an active school before upgrading.'], 422);

        $checkoutLock = Cache::lock('subscription-checkout:school:'.$school->id, 60);
        if (! $checkoutLock->get()) {
            return response()->json(['success' => false, 'message' => 'Another subscription checkout is already being prepared for this school. Please retry shortly.'], 409);
        }

        try {
        $platformSettings = SystemSetting::first();
        if ($platformSettings && !$platformSettings->enforce_subscriptions) {
            return response()->json(['success' => false, 'message' => 'All schools currently have free platform access. Payment will be required when the Software Owner enables subscription enforcement.'], 422);
        }

        $plan = SubscriptionPlan::whereKey($data['subscription_plan_id'])
            ->where('is_active', true)
            ->first();
        if (!$plan) return response()->json(['success' => false, 'message' => 'The selected subscription plan is unavailable.'], 422);

        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->latest()
            ->first();
        if ($subscription?->is_exempt) return response()->json(['success' => false, 'message' => 'This school has free access and does not need to pay.'], 422);
        if ($subscription && $subscription->discount_percentage >= 100 && $subscription->hasActiveDiscount()) {
            return response()->json(['success' => false, 'message' => 'This school has a free-access period and does not need to pay yet.'], 422);
        }

        $planCurrency = strtoupper((string) ($plan->currency ?: 'NGN'));
        $merchantCurrency = strtoupper((string) config('services.paystack.currency', 'NGN'));
        if ($planCurrency !== $merchantCurrency) {
            return response()->json([
                'success' => false,
                'message' => "This plan uses {$planCurrency}, but this Paystack merchant is configured for {$merchantCurrency}. Update the plan currency or PAYSTACK_CURRENCY before retrying.",
            ], 422);
        }

        $baseAmount = match ($data['billing_cycle']) {
            'monthly' => (float) $plan->monthly_price,
            'quarterly' => (float) $plan->quarterly_price,
            'half_yearly' => (float) $plan->half_yearly_price,
            default => (float) $plan->yearly_price,
        };
        $amount = $subscription
            ? $subscription->discountedPrice($baseAmount)
            : $baseAmount;
        if ($amount <= 0) return response()->json(['success' => false, 'message' => 'No amount is due for the selected plan.'], 422);

        $pending = DB::table('payment_transactions')
            ->where('school_id', $school->id)
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(24))
            ->latest()
            ->first();
        if ($pending) {
            $pendingPayload = is_string($pending->gateway_response) ? json_decode($pending->gateway_response, true) : (array) $pending->gateway_response;
            if (!empty($pendingPayload['authorization_url'])) {
                return response()->json(['success' => true, 'message' => 'A subscription payment is already pending. Resume the existing checkout.', 'data' => ['authorization_url' => $pendingPayload['authorization_url'], 'reference' => $pending->reference, 'resumed' => true]]);
            }

            DB::table('payment_transactions')->where('id', $pending->id)->update([
                'status' => 'failed',
                'failure_reason' => 'Previous checkout did not receive a valid Paystack authorization URL.',
                'updated_at' => now(),
            ]);
        }

        $secretKey = config('services.paystack.secret_key');
        if (!$secretKey) return response()->json(['success' => false, 'message' => 'Paystack is not configured on the server.'], 422);

        $createdSubscription = false;
        if (!$subscription) {
            $subscription = SchoolSubscription::create([
                'school_id' => $school->id,
                'subscription_plan_id' => $plan->id,
                'billing_cycle' => $data['billing_cycle'],
                'status' => 'pending',
                'amount_paid' => 0,
                'currency' => strtoupper((string) ($plan->currency ?: 'NGN')),
                'is_current' => true,
                'is_exempt' => false,
            ]);
            $createdSubscription = true;
        }

        $reference = 'DONO_SUB_' . Str::upper(Str::random(32));
        $callbackUrl = rtrim((string) (config('app.frontend_url') ?: $request->getSchemeAndHttpHost()), '/') . '/subscription-payment?reference=' . $reference;
        $currency = $planCurrency;
        $payload = [
            'email' => strtolower(trim($user->email)),
            'amount' => (int) round($amount * 100),
            'currency' => $currency,
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => [
                'payment_type' => 'subscription',
                'school_id' => $school->id,
                'school_subscription_id' => $subscription->id,
                'subscription_plan_id' => $plan->id,
                'billing_cycle' => $data['billing_cycle'],
            ],
        ];

        $paymentUrl = rtrim((string) config('services.paystack.payment_url', 'https://api.paystack.co'), '/');
        $response = Http::withToken($secretKey)->timeout(30)->post($paymentUrl . '/transaction/initialize', $payload);
        $gatewayBody = $response->json();
        $gatewayData = is_array($gatewayBody['data'] ?? null) ? $gatewayBody['data'] : [];
        $authorizationUrl = $gatewayData['authorization_url'] ?? null;

        if (!$response->successful() || !$authorizationUrl) {
            if ($subscription->status === 'pending' && !$subscription->payment_reference) {
                $subscription->update(['status' => 'expired']);
                if ($createdSubscription) {
                    $subscription->delete();
                }
            }

            $gatewayMessage = $gatewayBody['message'] ?? $gatewayData['message'] ?? null;
            return response()->json([
                'success' => false,
                'message' => $gatewayMessage
                    ? 'Paystack could not initialize the subscription payment: ' . $gatewayMessage
                    : 'Paystack could not initialize the subscription payment. Check the Paystack currency, key mode, and account configuration.',
            ], $response->status() >= 400 ? $response->status() : 502);
        }
        DB::table('payment_transactions')->insert([
            'school_id' => $school->id,
            'school_subscription_id' => $subscription->id,
            'gateway' => 'paystack',
            'reference' => $reference,
            'amount' => $amount,
            'currency' => $currency,
            'billing_cycle' => $data['billing_cycle'],
            'status' => 'pending',
            'gateway_response' => json_encode([
                'authorization_url' => $authorizationUrl,
                'subscription_plan_id' => $plan->id,
                'billing_cycle' => $data['billing_cycle'],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $subscription->update(['payment_reference' => $reference]);

        return response()->json(['success' => true, 'data' => ['authorization_url' => $authorizationUrl, 'reference' => $reference]]);
        } finally {
            optional($checkoutLock)->release();
        }
    }

    public function verifySubscription(Request $request, $reference)
    {
        $schoolId = $this->context->currentSchool($request->user())?->id;
        $transaction = DB::table('payment_transactions')->where('reference', $reference)->where('school_id', $schoolId)->first();
        if (!$transaction) return response()->json(['success' => false, 'message' => 'Subscription payment record not found for the active school.'], 404);
        if ($transaction->status === 'successful') return response()->json(['success' => true, 'message' => 'Subscription payment was already verified.', 'data' => ['reference' => $reference, 'status' => 'active']]);

        $subscription = SchoolSubscription::where('school_id', $schoolId)->whereKey($transaction->school_subscription_id)->first();
        if (!$subscription) return response()->json(['success' => false, 'message' => 'Subscription record not found.'], 404);

        $secretKey = config('services.paystack.secret_key');
        abort_unless($secretKey, 422, 'Paystack is not configured on the server.');
        $paymentUrl = rtrim((string) config('services.paystack.payment_url', 'https://api.paystack.co'), '/');
        $response = Http::withToken($secretKey)->timeout(30)->get($paymentUrl . '/transaction/verify/' . rawurlencode($reference));
        if (!$response->successful()) return response()->json(['success' => false, 'message' => 'Paystack verification could not be completed.'], 502);

        $gatewayData = $response->json()['data'] ?? [];
        if (($gatewayData['status'] ?? null) !== 'success') return response()->json(['success' => false, 'message' => 'Payment has not been confirmed as successful.'], 400);
        if ((int) ($gatewayData['amount'] ?? 0) !== (int) round((float) $transaction->amount * 100)) return response()->json(['success' => false, 'message' => 'Verified amount does not match the pending subscription payment.'], 422);

        $this->activatePaidSubscription($subscription, ((float) $gatewayData['amount']) / 100, $reference, $gatewayData);
        $updatedSubscription = $subscription->fresh();
        $startsAfterTrial = $updatedSubscription?->start_date && $updatedSubscription->start_date->isFuture();
        $message = $startsAfterTrial
            ? 'Payment verified. Your paid subscription will start after the free trial ends on ' . $updatedSubscription->start_date->toDateString() . '.'
            : 'Subscription payment verified and activated.';

        return response()->json(['success' => true, 'message' => $message, 'data' => ['reference' => $reference, 'status' => $updatedSubscription?->status, 'start_date' => $updatedSubscription?->start_date]]);
    }

    public function webhook(Request $request)
    {
        $signature = $request->header('X-Paystack-Signature');
        $secretKey = config('services.paystack.secret_key');
        if (!$signature || !$secretKey || !hash_equals(hash_hmac('sha512', $request->getContent(), $secretKey), $signature)) {
            return response()->json(['success' => false], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);

        if ($event === 'charge.success') {
            $reference = $data['reference'] ?? null;
            $amountPaid = ($data['amount'] ?? 0) / 100;

            if ($reference) {
                $transaction = DB::table('payment_transactions')->where('reference', $reference)->first();
                $subscription = $transaction ? SchoolSubscription::find($transaction->school_subscription_id) : SchoolSubscription::where('payment_reference', $reference)->first();
                if ($subscription && $transaction && $transaction->status !== 'successful' && (int) round((float) $transaction->amount * 100) === (int) ($data['amount'] ?? 0)) {
                    $this->activatePaidSubscription($subscription, $amountPaid, $reference, $data);
                }

                $feeTransaction = FeePaymentTransaction::where('reference', $reference)->first();
                if ($feeTransaction && $feeTransaction->status !== 'successful' && (int) round((float) $feeTransaction->amount * 100) === (int) ($data['amount'] ?? 0)) {
                    $this->settleFeePaymentTransaction($feeTransaction, $data);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    private function settleFeePaymentTransaction(FeePaymentTransaction $transaction, array $gatewayData): void
    {
        DB::transaction(function () use ($transaction, $gatewayData) {
            $locked = FeePaymentTransaction::whereKey($transaction->id)->lockForUpdate()->first();
            if (! $locked || $locked->status === 'successful') return;

            $amountPaid = ((float) ($gatewayData['amount'] ?? 0)) / 100;
            abort_unless((int) round($amountPaid * 100) === (int) round((float) $locked->amount * 100), 422, 'Verified fee payment amount does not match the pending transaction.');

            $this->paymentService->recordPayment([
                'student_fee_id' => $locked->student_fee_id,
                'staff_id' => null,
                'amount_paid' => $amountPaid,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'Online',
                'transaction_reference' => $locked->reference,
                'bank_name' => $gatewayData['authorization']['bank'] ?? 'Paystack',
                'remarks' => 'Online Paystack Gateway Settlement',
            ]);

            $locked->update([
                'status' => 'successful',
                'paid_at' => now(),
                'gateway_response' => $gatewayData,
            ]);
        });
    }

    private function activatePaidSubscription(SchoolSubscription $subscription, float $amountPaid, string $reference, array $gatewayData = []): void
    {
        DB::transaction(function () use ($subscription, $amountPaid, $reference, $gatewayData) {
            $transaction = DB::table('payment_transactions')->where('reference', $reference)->lockForUpdate()->first();
            if ($transaction?->status === 'successful') return;

            $stored = $transaction && is_string($transaction->gateway_response) ? json_decode($transaction->gateway_response, true) : [];
            $planId = $stored['subscription_plan_id'] ?? ($gatewayData['metadata']['subscription_plan_id'] ?? null);
            $billingCycle = $stored['billing_cycle'] ?? ($gatewayData['metadata']['billing_cycle'] ?? $subscription->billing_cycle);

            $subscription->refresh();
            if ($planId) $subscription->subscription_plan_id = $planId;
            $subscription->billing_cycle = $billingCycle;

            $trialIsActive = $subscription->status === 'trial'
                && $subscription->trial_ends_at
                && now()->lessThanOrEqualTo($subscription->trial_ends_at->copy()->endOfDay());

            if ($trialIsActive) {
                // The paid period starts the day after the free trial ends.
                $startDate = $subscription->trial_ends_at->copy()->addDay()->startOfDay();
            } elseif ($subscription->expiry_date && $subscription->expiry_date->isFuture()) {
                // A renewal extends an already active paid period instead of overlapping it.
                $startDate = $subscription->expiry_date->copy()->startOfDay();
            } else {
                $startDate = now()->startOfDay();
            }

            $expiryDate = match ($subscription->billing_cycle) {
                'monthly' => $startDate->copy()->addMonth(),
                'quarterly' => $startDate->copy()->addMonths(3),
                'half_yearly' => $startDate->copy()->addMonths(6),
                default => $startDate->copy()->addYear(),
            };

            $subscription->update([
                'status' => 'active',
                'is_current' => true,
                'start_date' => $startDate,
                'expiry_date' => $expiryDate,
                'next_billing_date' => $expiryDate,
                'amount_paid' => $amountPaid,
                'payment_reference' => $reference,
            ]);

            if ($transaction) {
                DB::table('payment_transactions')->where('reference', $reference)->update([
                    'status' => 'successful',
                    'paid_at' => now(),
                    'gateway_transaction_id' => $gatewayData['id'] ?? null,
                    'gateway_response' => json_encode($gatewayData ?: $stored),
                    'updated_at' => now(),
                ]);
            }
        });
    }
}
