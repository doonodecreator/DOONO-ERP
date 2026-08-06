<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    public function initialize(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:100',
            'fee_category_id' => 'required|exists:fee_categories,id',
        ]);

        $student = DB::table('students')->where('id', $request->student_id)->first();
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        }

        $schoolSettings = DB::table('school_settings')
            ->where('school_id', $student->school_id)
            ->first();

        $secretKey = $schoolSettings->paystack_secret_key ?? config('services.paystack.secret');
        $subaccountCode = $schoolSettings->paystack_subaccount_code ?? null;

        if (!$secretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway is not configured for this school. Please contact administration.'
            ], 422);
        }

        $reference = 'DONO_FEE_' . uniqid();
        $callbackUrl = config('app.frontend_url', 'http://localhost:5173') . '/fees-payments?reference=' . $reference;

        $payload = [
            'email' => $student->email ?? 'student@donoerp.com',
            'amount' => $request->amount * 100,
            'reference' => $reference,
            'callback_url' => $callbackUrl,
            'metadata' => [
                'student_id' => $student->id,
                'school_id' => $student->school_id,
                'fee_category_id' => $request->fee_category_id,
            ]
        ];

        if ($subaccountCode) {
            $payload['subaccount'] = $subaccountCode;
        }

        $response = Http::withToken($secretKey)
            ->post('https://api.paystack.co/transaction/initialize', $payload);

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
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to initialize payment with Paystack.',
            'error' => $response->json()['message'] ?? 'Unknown error'
        ], 400);
    }

    public function verify($reference)
    {
        $payment = DB::table('fee_payments')->where('reference', $reference)->first();
        if (!payment) {
            return response()->json(['success' => false, 'message' => 'Payment record not found.'], 404);
        }

        $schoolSettings = DB::table('school_settings')
            ->where('school_id', $payment->school_id)
            ->first();

        $secretKey = $schoolSettings->paystack_secret_key ?? config('services.paystack.secret');

        $response = Http::withToken($secretKey)
            ->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->successful()) {
            $data = $response->json()['data'];

            if ($data['status'] === 'success') {
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
                    'data' => $data
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Payment verification failed or pending.'
        ], 400);
    }

    public function webhook(Request $request)
    {
        $signature = $request->header('X-Paystack-Signature');
        if (!$signature) {
            return response()->json(['success' => false, 'message' => 'No signature provided'], 400);
        }

        $secretKey = config('services.paystack.secret');
        if ($signature !== hash_hmac('sha512', $request->getContent(), $secretKey)) {
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.success') {
            $reference = $data['reference'] ?? null;
            $amountPaid = ($data['amount'] ?? 0) / 100;

            if ($reference) {
                $payment = DB::table('fee_payments')->where('reference', $reference)->first();

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

        return response()->json(['status' => 'success']);
    }
}
