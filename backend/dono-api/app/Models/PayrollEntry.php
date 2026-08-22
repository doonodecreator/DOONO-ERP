<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollEntry extends Model
{
    protected $fillable = ['school_id', 'staff_id', 'pay_period', 'gross_amount', 'deductions', 'net_amount', 'status', 'paid_at', 'created_by'];

    protected $casts = ['gross_amount' => 'decimal:2', 'deductions' => 'decimal:2', 'net_amount' => 'decimal:2', 'paid_at' => 'datetime'];

    public function school(): BelongsTo { return $this->belongsTo(School::class); }
    public function staff(): BelongsTo { return $this->belongsTo(Staff::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
