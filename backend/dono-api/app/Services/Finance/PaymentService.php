<?php

namespace App\Services\Finance;

use App\Models\FeePayment;
use App\Models\PaymentReceipt;
use App\Models\StudentFee;
use App\Services\PaystackService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        protected FeeService $feeService,
        protected PaystackService $paystackService
    ) {}

    /**
     * Record a fee payment and generate an official receipt.
     */
    public function recordPayment(array $data): FeePayment
    {
        return DB::transaction(function () use ($data) {
            $studentFee = StudentFee::query()->whereKey($data['student_fee_id'])->lockForUpdate()->firstOrFail();
            $amount = round((float) $data['amount_paid'], 2);
            $paid = (float) $studentFee->payments()->whereNull('reversed_at')->sum('amount_paid');
            $outstanding = max(0, round((float) $studentFee->amount_due - $paid, 2));
            if ($amount <= 0 || $amount > $outstanding + 0.005) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'The payment must be positive and must not exceed the outstanding invoice balance.',
                ]);
            }

            $transactionReference = trim((string) ($data['transaction_reference'] ?? ''));
            if ($transactionReference === '') {
                $transactionReference = Str::upper(Str::random(12));
            }
            $existing = FeePayment::query()
                ->where('transaction_reference', $transactionReference)
                ->lockForUpdate()
                ->first();
            if ($existing) {
                if (! $existing->reversed_at && (int) $existing->student_fee_id === (int) $studentFee->id && abs((float) $existing->amount_paid - $amount) < 0.005) {
                    return $existing->load('receipt');
                }
                throw ValidationException::withMessages([
                    'transaction_reference' => 'This transaction reference has already been used for another payment.',
                ]);
            }

            $receiptNumber = $this->generateReceiptNumber();

            // 1. Record Fee Payment
            $payment = FeePayment::create([
                'student_fee_id' => $studentFee->id,
                'staff_id' => $data['staff_id'] ?? null,
                'receipt_number' => $receiptNumber,
                'amount_paid' => $amount,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'payment_method' => $data['payment_method'], // 'cash', 'bank_transfer', 'pos', 'online'
                'transaction_reference' => $transactionReference,
                'bank_name' => $data['bank_name'] ?? null,
                'remarks' => $data['remarks'] ?? null,
            ]);

            // 2. Generate Official Payment Receipt
            PaymentReceipt::create([
                'fee_payment_id' => $payment->id,
                'receipt_number' => $receiptNumber,
                'issued_by' => $data['staff_id'] ?? null,
                'issued_at' => now(),
                'printed' => false,
                'emailed' => false,
                'cancelled' => false,
            ]);

            // 3. Recalculate Invoice Status
            $this->feeService->recalculateStatus($studentFee);

            return $payment->load('receipt');
        });
    }

    /**
     * Record an idempotent payment submitted by an authorized school integration.
     *
     * Unlike the cashier workflow, this contract requires a stable external
     * transaction reference and refuses amounts above the outstanding balance.
     */
    public function recordIntegrationPayment(array $data, int $schoolId): FeePayment
    {
        return DB::transaction(function () use ($data, $schoolId): FeePayment {
            $studentFee = StudentFee::query()
                ->whereKey($data['student_fee_id'])
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->first();

            if (! $studentFee) {
                throw ValidationException::withMessages([
                    'student_fee_id' => 'The selected fee invoice does not belong to this school.',
                ]);
            }

            $existing = FeePayment::query()
                ->with('studentFee:id,school_id')
                ->where('transaction_reference', $data['transaction_reference'])
                ->lockForUpdate()
                ->first();
            if ($existing) {
                if ((int) $existing->studentFee?->school_id !== $schoolId) {
                    throw ValidationException::withMessages([
                        'transaction_reference' => 'This transaction reference has already been used by another school.',
                    ]);
                }

                return $existing->load('receipt');
            }

            $paid = (float) $studentFee->payments()->whereNull('reversed_at')->sum('amount_paid');
            $outstanding = max(0, (float) $studentFee->amount_due - $paid);
            $amount = (float) $data['amount_paid'];
            if ($amount <= 0 || $amount > $outstanding + 0.005) {
                throw ValidationException::withMessages([
                    'amount_paid' => 'The payment must be positive and must not exceed the outstanding invoice balance.',
                ]);
            }

            $receiptNumber = $this->generateReceiptNumber();
            $payment = FeePayment::create([
                'student_fee_id' => $studentFee->id,
                'staff_id' => null,
                'receipt_number' => $receiptNumber,
                'amount_paid' => $amount,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'payment_method' => $data['payment_method'],
                'transaction_reference' => $data['transaction_reference'],
                'bank_name' => $data['bank_name'] ?? null,
                'remarks' => $data['remarks'] ?? 'Recorded by an authorized school integration.',
            ]);

            PaymentReceipt::create([
                'fee_payment_id' => $payment->id,
                'receipt_number' => $receiptNumber,
                'issued_by' => null,
                'issued_at' => now(),
                'printed' => false,
                'emailed' => false,
                'cancelled' => false,
            ]);

            $this->feeService->recalculateStatus($studentFee->fresh());

            return $payment->load('receipt');
        });
    }

    /**
     * Verify online Paystack payment and finalize settlement.
     */
    public function processPaystackSettlement(string $reference, int $studentFeeId, ?int $staffId = null): array
    {
        $verification = $this->paystackService->verifyPayment($reference);

        if (! isset($verification['status']) || ! $verification['status'] || $verification['data']['status'] !== 'success') {
            return [
                'success' => false,
                'message' => 'Payment verification failed or transaction not completed.',
            ];
        }

        $amountPaid = $verification['data']['amount'] / 100; // Paystack sends amounts in kobo

        $payment = $this->recordPayment([
            'student_fee_id' => $studentFeeId,
            'staff_id' => $staffId,
            'amount_paid' => $amountPaid,
            'payment_date' => now()->toDateString(),
            'payment_method' => 'online',
            'transaction_reference' => $reference,
            'bank_name' => $verification['data']['authorization']['bank'] ?? 'Paystack',
            'remarks' => 'Online Paystack Gateway Settlement',
        ]);

        return [
            'success' => true,
            'message' => 'Payment verified and settled successfully.',
            'payment' => $payment,
        ];
    }

    /**
     * Generate unique receipt number: REC-YYYYMMDD-XXXX
     */
    protected function generateReceiptNumber(): string
    {
        return sprintf('REC-%s-%s', now()->format('Ymd'), Str::upper(Str::random(5)));
    }
}
