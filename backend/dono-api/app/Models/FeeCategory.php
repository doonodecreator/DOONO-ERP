<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeCategory extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'code',
        'description',
        'default_amount',
        'frequency',
        'is_mandatory',
        'is_active',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function studentFees(): HasMany
    {
        return $this->hasMany(StudentFee::class);
    }
}
