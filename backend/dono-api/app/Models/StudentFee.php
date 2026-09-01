<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentFee extends Model
{
    protected $fillable = [
        'school_id',
        'invoice_number',
        'student_enrollment_id',
        'fee_category_id',
        'academic_session_id',
        'term_id',
        'amount',
        'discount',
        'amount_due',
        'due_date',
        'status',
        'remarks',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function feeCategory(): BelongsTo
    {
        return $this->belongsTo(FeeCategory::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(Term::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }

    public function getTotalPaidAttribute()
    {
        return $this->relationLoaded('payments')
            ? $this->payments->whereNull('reversed_at')->sum('amount_paid')
            : $this->payments()->whereNull('reversed_at')->sum('amount_paid');
    }

    public function getBalanceAttribute()
    {
        return max(0, (float) $this->amount_due - (float) $this->total_paid);
    }
}
