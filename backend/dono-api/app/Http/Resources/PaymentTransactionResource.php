<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $gatewayResponse = is_array($this->gateway_response) ? $this->gateway_response : [];

        return [
            'id' => $this->id,
            'school' => $this->whenLoaded('school', fn () => [
                'id' => $this->school?->id,
                'name' => $this->school?->name,
            ]),
            'subscription' => $this->whenLoaded('schoolSubscription', fn () => [
                'id' => $this->schoolSubscription?->id,
                'plan' => $this->schoolSubscription?->subscriptionPlan?->name,
                'plan_slug' => $this->schoolSubscription?->subscriptionPlan?->slug,
            ]),
            'gateway' => $this->gateway,
            'reference' => $this->reference,
            'gateway_transaction_id' => $this->gateway_transaction_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'billing_cycle' => $this->billing_cycle,
            'status' => $this->status,
            'reconciliation_status' => $this->reconciliation_status,
            'paid_at' => $this->paid_at,
            'verified_at' => $this->verified_at,
            'failure_reason' => $this->failure_reason,
            'is_refunded' => (bool) $this->is_refunded,
            'refund_id' => $this->refund_id,
            'refund_status' => $this->refund_status,
            'refund_amount' => $this->refund_amount,
            'refund_reason' => $this->refund_reason,
            'refund_requested_at' => $this->refund_requested_at,
            'refunded_at' => $this->refunded_at,
            'reviewed_at' => $this->reviewed_at,
            'reviewer' => $this->whenLoaded('reviewer', fn () => [
                'id' => $this->reviewer?->id,
                'name' => $this->reviewer?->name,
            ]),
            'checkout_url' => $gatewayResponse['authorization_url'] ?? null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
