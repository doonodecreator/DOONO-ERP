<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceiptMail;
use App\Models\PaymentTransaction;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    protected PaystackService $paystack;

    public function __construct(PaystackService $paystack)
    {
        $this->paystack = $paystack;
    }

    /**
     * Initialize payment.
     */
    public function initialize(Request $request)
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
            'billing_cycle' => 'required|in:monthly,quarterly,half_yearly,yearly',
        ]);

        $school = School::findOrFail($request->school_id);

        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->firstOrFail();

        $billingCycle = $request->billing_cycle;
        $plan = $subscription->subscriptionPlan;

        $reference = 'DONO-' . strtoupper(Str::random(12));

        $amount = match ($billingCycle) {
            'monthly' => $plan->monthly_price,
            'quarterly' => $plan->quarterly_price,
            'half_yearly' => $plan->half_yearly_price,
            default => $plan->yearly_price,
        };

        $transaction = PaymentTransaction::create([
            'school_id' => $school->id,
            'school_subscription_id' => $subscription->id,
            'gateway' => 'paystack',
            'reference' => $reference,
            'amount' => $amount,
            'currency' => $subscription->currency,
            'status' => 'pending',
            'billing_cycle' => $billingCycle,
        ]);

        $response = $this->paystack->initializePayment([
            'email' => $school->email,
            'amount' => (int) ($transaction->amount * 100),
            'reference' => $reference,
            'callback_url' => config('services.paystack.callback_url'),
        ]);

        return response()->json($response);
    }

    /**
     * Verify payment.
     */
    public function verify(string $reference)
    {
        $response = $this->paystack->verifyPayment($reference);

        if (
            !isset($response['status']) ||
            $response['status'] !== true
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to verify payment.',
            ], 400);
        }

        $data = $response['data'];

        $transaction = PaymentTransaction::where(
            'reference',
            $reference
        )->firstOrFail();

        if ($transaction->isSuccessful()) {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified.',
            ]);
        }

        if ($data['status'] !== 'success') {

            $transaction->markFailed(
                $data['gateway_response'] ?? 'Payment failed.'
            );

            return response()->json([
                'success' => false,
                'message' => 'Payment failed.',
            ], 400);
        }

        $transaction->update([
            'gateway_transaction_id' => $data['id'],
        ]);

        $transaction->markSuccessful($data);

        Mail::to($transaction->school->email)
            ->send(new PaymentReceiptMail($transaction));

        $subscription = $transaction->schoolSubscription;
$subscription->update([
            'status' => 'active',
            'amount_paid' => $transaction->amount,
            'payment_reference' => $reference,
            'expiry_date' => match ($transaction->billing_cycle) {
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'half_yearly' => now()->addMonths(6),
                default => now()->addYear(),
            },
            'next_billing_date' => match ($transaction->billing_cycle) {
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'half_yearly' => now()->addMonths(6),
                default => now()->addYear(),
            },
            'billing_cycle' => $transaction->billing_cycle,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'transaction' => $transaction->fresh(),
            'subscription' => $subscription->fresh(),
        ]);
    }

    /**
     * Paystack webhook.
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('x-paystack-signature');

        $computedSignature = hash_hmac(
            'sha512',
            $request->getContent(),
            config('services.paystack.secret_key')
        );

        if ($signature !== $computedSignature) {

            Log::warning('Invalid Paystack webhook signature.');

            return response()->json([
                'message' => 'Invalid signature.'
            ], 401);
        }

        $payload = $request->all();

        if (($payload['event'] ?? '') !== 'charge.success') {
            return response()->json([
                'message' => 'Event ignored.'
            ]);
        }

        $data = $payload['data'];

        $transaction = PaymentTransaction::where(
            'reference',
            $data['reference']
        )->first();

        if (!$transaction) {

            Log::warning(
                'Payment transaction not found: ' .
                $data['reference']
            );

            return response()->json([
                'message' => 'Transaction not found.'
            ], 404);
        }

        if ($transaction->isSuccessful()) {

            return response()->json([
                'message' => 'Already processed.'
            ]);
        }

        $transaction->update([
            'gateway_transaction_id' => $data['id'],
        ]);

        $transaction->markSuccessful($data);

        Mail::to($transaction->school->email)
            ->send(new PaymentReceiptMail($transaction));

        $subscription = $transaction->schoolSubscription;

        $subscription->update([
            'status' => 'active',
            'amount_paid' => $transaction->amount,
            'payment_reference' => $transaction->reference,
            'expiry_date' => match ($transaction->billing_cycle) {
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'half_yearly' => now()->addMonths(6),
                default => now()->addYear(),
            },
            'next_billing_date' => match ($transaction->billing_cycle) {
                'monthly' => now()->addMonth(),
                'quarterly' => now()->addMonths(3),
                'half_yearly' => now()->addMonths(6),
                default => now()->addYear(),
            },
            'billing_cycle' => $transaction->billing_cycle,
        ]);

        Log::info(
            'Subscription activated successfully.',
            [
                'school_id' => $subscription->school_id,
                'reference' => $transaction->reference,
            ]
        );

        return response()->json([
            'message' => 'Webhook processed successfully.'
        ]);
    }

    /**
     * Payment history.
     */
    public function history(School $school)
    {
        $transactions = PaymentTransaction::with([
            'schoolSubscription.subscriptionPlan'
        ])
        ->where('school_id', $school->id)
        ->latest()
        ->paginate(20);

        return response()->json([
            'success' => true,
            'school' => [
                'id' => $school->id,
                'name' => $school->name,
            ],
            'payments' => $transactions,
        ]);
    }
}
