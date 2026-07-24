<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultComponent extends Model
{
    protected $fillable = [
        'result_id',
        'assessment_structure_id',
        'score',
        'weighted_score',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'weighted_score' => 'decimal:2',
    ];

    /**
     * Parent result.
     */
    public function result(): BelongsTo
    {
        return $this->belongsTo(Result::class);
    }

    /**
     * Assessment structure.
     */
    public function assessmentStructure(): BelongsTo
    {
        return $this->belongsTo(
            AssessmentStructure::class
        );
    }
}
