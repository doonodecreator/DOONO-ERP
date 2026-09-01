<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptController extends Controller
{
    /**
     * Download payment receipt.
     */
    public function download(string $reference)
    {
        $transaction = PaymentTransaction::with([
            'school',
            'schoolSubscription.subscriptionPlan'
        ])
        ->where('reference', $reference)
        ->firstOrFail();

        $pdf = Pdf::loadView(
            'receipts.payment',
            [
                'transaction' => $transaction,
                'school' => $transaction->school,
                'subscription' => $transaction->schoolSubscription,
                'plan' => $transaction->schoolSubscription->subscriptionPlan,
            ]
        );

        return $pdf->download(
            'DOONO-Receipt-' . $reference . '.pdf'
        );
    }
}
