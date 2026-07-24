<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentReceipt extends Model
{
    protected $fillable = [
        'fee_payment_id',
        'receipt_number',
        'issued_by',
        'issued_at',
        'printed',
        'printed_at',
        'emailed',
        'emailed_at',
        'cancelled',
        'cancellation_reason',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'printed_at' => 'datetime',
        'emailed_at' => 'datetime',
        'printed' => 'boolean',
        'emailed' => 'boolean',
        'cancelled' => 'boolean',
    ];

    public function feePayment(): BelongsTo
    {
        return $this->belongsTo(FeePayment::class);
    }
}
