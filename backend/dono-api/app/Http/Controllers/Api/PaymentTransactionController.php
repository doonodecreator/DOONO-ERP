<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class PaymentTransactionController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $isPlatformAdmin = $user->isSuperAdmin();
        $schoolId = $isPlatformAdmin ? null : $this->context->currentSchool($user)?->id;

        if (! $isPlatformAdmin) {
            abort_unless($schoolId && $user->hasPermission('view_finance_reports', $schoolId), 403, 'You are not permitted to view payment reconciliation records.');
        }

        $query = PaymentTransaction::query()
            ->with([
                'school:id,name',
                'schoolSubscription.subscriptionPlan:id,name,slug',
                'reviewer:id,name',
            ])
            ->when($schoolId, fn ($builder) => $builder->where('school_id', $schoolId))
            ->when($isPlatformAdmin && $request->filled('school_id'), fn ($builder) => $builder->where('school_id', $request->integer('school_id')))
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', $request->string('status')->toString()))
            ->when($request->filled('reconciliation_status'), fn ($builder) => $builder->where('reconciliation_status', $request->string('reconciliation_status')->toString()))
            ->when($request->filled('search'), function ($builder) use ($request): void {
                $search = trim($request->string('search')->toString());
                $builder->where(function ($nested) use ($search): void {
                    $nested->where('reference', 'like', "%{$search}%")
                        ->orWhere('gateway_transaction_id', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        return PaymentTransactionResource::collection($query->paginate($this->perPage($request)));
    }

    public function show(Request $request, PaymentTransaction $paymentTransaction)
    {
        $this->authorizeTransaction($request, $paymentTransaction);

        return new PaymentTransactionResource($paymentTransaction->load([
            'school:id,name',
            'schoolSubscription.subscriptionPlan:id,name,slug',
            'reviewer:id,name',
        ]));
    }

    public function review(Request $request, PaymentTransaction $paymentTransaction)
    {
        $this->authorizePlatformAdmin($request);
        $this->authorizeTransaction($request, $paymentTransaction);

        $data = $request->validate([
            'reconciliation_status' => ['required', Rule::in(['needs_review', 'failed'])],
            'reconciliation_notes' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        abort_if($paymentTransaction->status === 'successful', 422, 'A successful payment cannot be manually changed. Use a verified gateway reversal or refund workflow.');
        abort_if($paymentTransaction->status === 'refunded', 422, 'A refunded payment cannot be manually reviewed.');

        $before = $paymentTransaction->only(['status', 'reconciliation_status', 'failure_reason', 'reviewed_by', 'reviewed_at', 'reconciliation_notes']);

        DB::transaction(function () use ($paymentTransaction, $data, $request): void {
            $locked = PaymentTransaction::query()->whereKey($paymentTransaction->id)->lockForUpdate()->firstOrFail();
            abort_if(in_array($locked->status, ['successful', 'refunded'], true), 422, 'This payment changed while it was being reviewed. Reload the queue.');

            $updates = [
                'reconciliation_status' => $data['reconciliation_status'],
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'reconciliation_notes' => $data['reconciliation_notes'],
            ];

            if ($data['reconciliation_status'] === 'failed') {
                $updates['status'] = 'failed';
                $updates['failure_reason'] = $data['reconciliation_notes'];
            }

            $locked->update($updates);
        });

        $updated = $paymentTransaction->fresh();
        ActivityLogService::log(
            'payments',
            'reconciliation_reviewed',
            "Payment {$updated->reference} was reviewed by the Software Owner.",
            $updated,
            ['before' => $before, 'after' => $updated->only(['status', 'reconciliation_status', 'failure_reason', 'reviewed_by', 'reviewed_at', 'reconciliation_notes'])],
            $updated->school_id,
        );

        return (new PaymentTransactionResource($updated->load(['school:id,name', 'schoolSubscription.subscriptionPlan:id,name,slug', 'reviewer:id,name'])))->additional(['message' => 'Payment reconciliation review saved.']);
    }

    public function refund(Request $request, PaymentTransaction $paymentTransaction)
    {
        $this->authorizePlatformAdmin($request);
        $this->authorizeTransaction($request, $paymentTransaction);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        abort_unless($paymentTransaction->status === 'successful', 422, 'Only a successful payment can be refunded.');
        abort_if($paymentTransaction->is_refunded, 422, 'This payment has already been refunded.');
        abort_if(in_array($paymentTransaction->refund_status, ['pending', 'processing', 'needs_attention'], true), 409, 'A refund is already in progress for this payment.');

        $secretKey = config('services.paystack.secret_key');
        abort_unless($secretKey, 422, 'Paystack is not configured on the server.');

        $lock = Cache::lock('payment-refund:' . $paymentTransaction->id, 60);
        abort_unless($lock->get(), 409, 'Another refund request is already being prepared for this payment.');

        try {
            $reference = $paymentTransaction->gateway_transaction_id ?: $paymentTransaction->reference;
            $response = Http::withToken($secretKey)
                ->timeout(30)
                ->post(rtrim((string) config('services.paystack.payment_url', 'https://api.paystack.co'), '/') . '/refund', [
                    'transaction' => $reference,
                    'currency' => $paymentTransaction->currency,
                    'merchant_note' => $data['reason'],
                    'customer_note' => 'Refund for subscription payment ' . $paymentTransaction->reference,
                ]);
            $body = $response->json();
            $refund = is_array($body['data'] ?? null) ? $body['data'] : [];
            abort_unless($response->successful() && ($body['status'] ?? false) && $refund, 502, $body['message'] ?? 'Paystack could not queue the refund.');

            $refundStatus = strtolower((string) ($refund['status'] ?? 'pending'));
            $confirmed = in_array($refundStatus, ['success', 'successful', 'processed', 'complete', 'completed'], true);
            $before = $paymentTransaction->only(['status', 'is_refunded', 'refund_status', 'refund_id', 'refund_amount']);
            $paymentTransaction->update([
                'refund_id' => isset($refund['id']) ? (string) $refund['id'] : null,
                'refund_status' => $confirmed ? 'processed' : $refundStatus,
                'refund_amount' => $paymentTransaction->amount,
                'refund_response' => $body,
                'refund_reason' => $data['reason'],
                'refund_requested_by' => $request->user()->id,
                'refund_requested_at' => now(),
                'refunded_at' => $confirmed ? now() : null,
                'is_refunded' => $confirmed,
                'status' => $confirmed ? 'refunded' : $paymentTransaction->status,
            ]);

            ActivityLogService::log(
                'payments',
                $confirmed ? 'refund_processed' : 'refund_requested',
                "Refund {$paymentTransaction->reference} was " . ($confirmed ? 'processed.' : 'queued for processing.'),
                $paymentTransaction,
                ['before' => $before, 'after' => $paymentTransaction->fresh()->only(['status', 'is_refunded', 'refund_status', 'refund_id', 'refund_amount']), 'reason' => $data['reason']],
                $paymentTransaction->school_id,
            );

            return (new PaymentTransactionResource($paymentTransaction->fresh()->load(['school:id,name', 'schoolSubscription.subscriptionPlan:id,name,slug', 'reviewer:id,name'])))->additional(['message' => $confirmed ? 'Refund processed.' : 'Refund queued for processing.']);
        } finally {
            $lock->release();
        }
    }

    private function authorizeTransaction(Request $request, PaymentTransaction $paymentTransaction): void
    {
        $user = $request->user();
        if ($user->isSuperAdmin()) {
            return;
        }

        $schoolId = $this->context->currentSchool($user)?->id;
        abort_unless($schoolId && (int) $paymentTransaction->school_id === (int) $schoolId && $user->hasPermission('view_finance_reports', $schoolId), 404, 'Payment transaction not found in the active school.');
    }

    private function authorizePlatformAdmin(Request $request): void
    {
        abort_unless($request->user()?->isSuperAdmin(), 403, 'Only the Software Owner can review payment reconciliation records.');
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }
}
