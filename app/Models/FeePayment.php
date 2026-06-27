<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FeePayment extends Model
{
    protected $fillable = [
        'student_fee_id',
        'amount_paid',
        'payment_method',
        'payment_date',
        'transaction_reference',
        'received_by',
        'remarks',
    ];

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(PaymentReceipt::class);
    }
}
