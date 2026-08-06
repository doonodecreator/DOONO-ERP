<?php

namespace App\Services\Finance;

use App\Models\FeePayment;
use App\Models\PaymentReceipt;
use App\Models\StudentFee;
use App\Services\PaystackService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            $studentFee = StudentFee::findOrFail($data['student_fee_id']);
            $receiptNumber = $this->generateReceiptNumber();

            // 1. Record Fee Payment
            $payment = FeePayment::create([
                'student_fee_id' => $studentFee->id,
                'staff_id' => $data['staff_id'] ?? null,
                'receipt_number' => $receiptNumber,
                'amount_paid' => $data['amount_paid'],
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'payment_method' => $data['payment_method'], // 'cash', 'bank_transfer', 'pos', 'online'
                'transaction_reference' => $data['transaction_reference'] ?? Str::upper(Str::random(12)),
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
