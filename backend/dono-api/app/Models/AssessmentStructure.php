<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentStructure extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'maximum_marks',
        'percentage',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'maximum_marks' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * School that owns this assessment structure.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
