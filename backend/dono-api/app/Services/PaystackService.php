<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaystackService
{
    protected string $secretKey;

    protected string $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');

        $this->baseUrl = config('services.paystack.payment_url');
    }

    /**
     * Initialize a Paystack payment.
     */
    public function initializePayment(array $data): array
    {
        $response = Http::withToken($this->secretKey)
            ->post(
                $this->baseUrl . '/transaction/initialize',
                $data
            );

        return $response->json();
    }

    /**
     * Verify a transaction.
     */
    public function verifyPayment(string $reference): array
    {
        $response = Http::withToken($this->secretKey)
            ->get(
                $this->baseUrl . '/transaction/verify/' . $reference
            );

        return $response->json();
    }

    /**
     * List transactions.
     */
    public function listTransactions(): array
    {
        return Http::withToken($this->secretKey)
            ->get(
                $this->baseUrl . '/transaction'
            )
            ->json();
    }
}
