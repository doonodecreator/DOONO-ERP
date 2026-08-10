<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    /**
     * Initialize a student/school fee payment.
     *
     * This existing functionality is kept intact.
     */
    public function initialize(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:100',
            'fee_category_id' => 'required|exists:fee_categories,id',
        ]);

        $student = DB::table('students')
            ->where('id', $request->student_id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.',
            ], 404);
        }

        $schoolSettings = DB::table('school_settings')
            ->where('school_id', $student->school_id)
            ->first();

        $secretKey = $schoolSettings->paystack_secret_key
            ?? config('services.paystack.secret');

        $subaccountCode = $schoolSettings->paystack_subaccount_code ?? null;

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway is not configured for this school. Please contact administration.',
            ], 422);
        }

        $reference = 'DONO_FEE_' . uniqid();

        $callbackUrl = config(
            'app.frontend_url',
            'http://localhost:5173'
        ) . '/fees-payments?reference=' . $reference;

        $payload = [
            'email' => $student->email ?? 'student@donoerp.com',
            'amount' => $request->amount * 100,
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => [
                'payment_type' => 'school_fee',
                'student_id' => $student->id,
                'school_id' => $student->school_id,
                'fee_category_id' => $request->fee_category_id,
            ],
        ];

        if ($subaccountCode) {
            $payload['subaccount'] = $subaccountCode;
        }

        $response = Http::withToken($secretKey)
            ->post(
                'https://api.paystack.co/transaction/initialize',
                $payload
            );

        if ($response->successful()) {
            $data = $response->json()['data'];

            DB::table('fee_payments')->insert([
                'school_id' => $student->school_id,
                'student_id' => $student->id,
                'fee_category_id' => $request->fee_category_id,
                'amount' => $request->amount,
                'reference' => $reference,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'authorization_url' => $data['authorization_url'],
                    'reference' => $reference,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to initialize payment with Paystack.',
            'error' => $response->json()['message'] ?? 'Unknown error',
        ], 400);
    }

    /**
     * Verify a school/student fee payment.
     */
    public function verify($reference)
    {
        $payment = DB::table('fee_payments')
            ->where('reference', $reference)
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found.',
            ], 404);
        }

        $schoolSettings = DB::table('school_settings')
            ->where('school_id', $payment->school_id)
            ->first();

        $secretKey = $schoolSettings->paystack_secret_key
            ?? config('services.paystack.secret');

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway is not configured.',
            ], 422);
        }

        $response = Http::withToken($secretKey)
            ->get(
                "https://api.paystack.co/transaction/verify/{$reference}"
            );

        if ($response->successful()) {
            $data = $response->json()['data'];

            if (($data['status'] ?? null) === 'success') {

                DB::table('fee_payments')
                    ->where('reference', $reference)
                    ->update([
                        'status' => 'success',
                        'updated_at' => now(),
                    ]);

                DB::table('payment_receipts')->updateOrInsert(
                    ['reference' => $reference],
                    [
                        'school_id' => $payment->school_id,
                        'student_id' => $payment->student_id,
                        'amount' => $data['amount'] / 100,
                        'fee_category_id' => $payment->fee_category_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Payment verified successfully.',
                    'data' => $data,
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Payment verification failed or pending.',
        ], 400);
    }

    /**
     * Initialize payment for the school's ERP subscription.
     *
     * IMPORTANT:
     *
     * The school cannot select:
     * - plan
     * - price
     * - billing cycle
     * - discount
     * - expiry date
     *
     * Those values are controlled by the platform owner.
     */
    public function initializeSubscription(Request $request)
    {
        $user = $request->user();

        $school = School::where('owner_id', $user->id)
            ->latest()
            ->first();

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'No school is associated with this account.',
            ], 404);
        }

        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->latest()
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'No subscription has been assigned to this school.',
            ], 404);
        }

        if ($subscription->is_exempt) {
            return response()->json([
                'success' => false,
                'message' => 'This school is exempt from subscription payment.',
            ], 422);
        }

        $amount = $subscription->effectivePrice();

        if ($amount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'There is currently no subscription amount due.',
            ], 422);
        }

        $secretKey = config('services.paystack.secret');

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription payment gateway is not configured.',
            ], 422);
        }

        $reference = 'DONO_SUB_' . strtoupper(uniqid());

        $callbackUrl = config(
            'app.frontend_url',
            'http://localhost:5173'
        ) . '/subscription-payment?reference=' . $reference;

        $email = $user->email;

        $payload = [
            'email' => $email,
            'amount' => (int) round($amount * 100),
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => [
                'payment_type' => 'subscription',
                'school_id' => $school->id,
                'school_subscription_id' => $subscription->id,
                'subscription_plan_id' => $subscription->subscription_plan_id,
                'billing_cycle' => $subscription->billing_cycle,
            ],
        ];

        $response = Http::withToken($secretKey)
            ->post(
                'https://api.paystack.co/transaction/initialize',
                $payload
            );

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize subscription payment.',
                'error' => $response->json()['message'] ?? 'Unknown Paystack error.',
            ], 400);
        }

        $data = $response->json()['data'] ?? null;

        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack returned an invalid payment response.',
            ], 400);
        }

        /*
         * Store the payment reference against the subscription.
         *
         * The subscription itself is NOT activated here.
         *
         * It becomes active only after Paystack confirms payment.
         */
        $subscription->update([
            'payment_reference' => $reference,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription payment initialized successfully.',
            'data' => [
                'authorization_url' => $data['authorization_url'],
                'access_code' => $data['access_code'] ?? null,
                'reference' => $reference,

                'subscription' => [
                    'id' => $subscription->id,
                    'plan' => $subscription->subscriptionPlan?->name,
                    'billing_cycle' => $subscription->billing_cycle,
                    'amount_due' => $amount,
                    'currency' => $subscription->currency,
                ],
            ],
        ]);
    }

    /**
     * Verify a subscription payment.
     */
    public function verifySubscription($reference)
    {
        $subscription = SchoolSubscription::with('subscriptionPlan')
            ->where('payment_reference', $reference)
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription payment record not found.',
            ], 404);
        }

        $secretKey = config('services.paystack.secret');

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription payment gateway is not configured.',
            ], 422);
        }

        $response = Http::withToken($secretKey)
            ->get(
                "https://api.paystack.co/transaction/verify/{$reference}"
            );

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to verify subscription payment.',
            ], 400);
        }

        $data = $response->json()['data'] ?? [];

        if (($data['status'] ?? null) !== 'success') {
            return response()->json([
                'success' => false,
                'message' => 'Subscription payment is not successful yet.',
            ], 400);
        }

        $this->activatePaidSubscription(
            $subscription,
            $data['amount'] / 100
        );

        return response()->json([
            'success' => true,
            'message' => 'Subscription payment verified successfully.',
            'data' => [
                'reference' => $reference,
                'subscription_id' => $subscription->id,
                'status' => $subscription->fresh()->status,
                'expiry_date' => $subscription->fresh()->expiry_date,
            ],
        ]);
    }

    /**
     * Paystack webhook.
     *
     * Handles both:
     * - school fee payments
     * - ERP subscription payments
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('X-Paystack-Signature');

        if (!$signature) {
            return response()->json([
                'success' => false,
                'message' => 'No signature provided.',
            ], 400);
        }

        $secretKey = config('services.paystack.secret');

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack secret key is not configured.',
            ], 500);
        }

        $expectedSignature = hash_hmac(
            'sha512',
            $request->getContent(),
            $secretKey
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature.',
            ], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);

        if ($event === 'charge.success') {

            $reference = $data['reference'] ?? null;
            $amountPaid = ($data['amount'] ?? 0) / 100;

            if ($reference) {

                /*
                 * -----------------------------------------------------
                 * SUBSCRIPTION PAYMENT
                 * -----------------------------------------------------
                 */
                $subscription = SchoolSubscription::where(
                    'payment_reference',
                    $reference
                )->first();

                if ($subscription) {

                    $this->activatePaidSubscription(
                        $subscription,
                        $amountPaid
                    );

                    return response()->json([
                        'status' => 'success',
                    ]);
                }

                /*
                 * -----------------------------------------------------
                 * SCHOOL FEE PAYMENT
                 * -----------------------------------------------------
                 */
                $payment = DB::table('fee_payments')
                    ->where('reference', $reference)
                    ->first();

                if ($payment && $payment->status !== 'success') {

                    DB::table('fee_payments')
                        ->where('reference', $reference)
                        ->update([
                            'status' => 'success',
                            'updated_at' => now(),
                        ]);

                    DB::table('payment_receipts')->updateOrInsert(
                        ['reference' => $reference],
                        [
                            'school_id' => $payment->school_id,
                            'student_id' => $payment->student_id,
                            'amount' => $amountPaid,
                            'fee_category_id' => $payment->fee_category_id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }

        return response()->json([
            'status' => 'success',
        ]);
    }

    /**
     * Activate a paid subscription.
     *
     * The subscription plan and billing cycle are NEVER supplied
     * by the school.
     *
     * They were already assigned by the platform owner.
     */
    private function activatePaidSubscription(
        SchoolSubscription $subscription,
        float $amountPaid
    ): void {
        DB::transaction(function () use ($subscription, $amountPaid) {

            $subscription->refresh();

            $startDate = now()->startOfDay();

            /*
             * If the subscription is still active and has an expiry
             * date in the future, extend from the existing expiry date.
             *
             * Otherwise start a new subscription from today.
             */
            if (
                $subscription->expiry_date &&
                now()->lessThan($subscription->expiry_date)
            ) {
                $startDate = $subscription->expiry_date->copy();
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
                'payment_reference' => $subscription->payment_reference,
            ]);
        });
    }

    /**
     * Payment history.
     *
     * This method is intentionally retained for the existing route.
     */
    public function history(Request $request, $school)
    {
        $payments = DB::table('fee_payments')
            ->where('school_id', $school)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }
}
