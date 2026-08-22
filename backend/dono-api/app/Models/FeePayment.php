<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class FeePayment extends Model
{
    protected $fillable = [
        'student_fee_id',
        'staff_id',
        'receipt_number',
        'amount_paid',
        'payment_date',
        'payment_method',
        'transaction_reference',
        'bank_name',
        'remarks',
        'reversed_at',
        'reversed_by',
        'reversal_reason',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'reversed_at' => 'datetime',
    ];

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(PaymentReceipt::class);
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }
}
