<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentReceipt extends Model
{
    protected $fillable = [
        'fee_payment_id',
        'receipt_number',
        'issued_at',
        'printed_by',
    ];

    public function feePayment(): BelongsTo
    {
        return $this->belongsTo(FeePayment::class);
    }
}
