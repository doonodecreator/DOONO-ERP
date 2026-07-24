<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradingSystem extends Model
{
    use HasFactory;

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'school_id',
        'minimum_score',
        'maximum_score',
        'grade',
        'remark',
        'grade_point',
        'is_active',
        'display_order',
    ];

    /**
     * Attribute casting.
     */
    protected $casts = [
        'grade_point' => 'decimal:2',
        'is_active' => 'boolean',
    ];
/**
     * School relationship.
     */
    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Only active grading rules.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Order grading rules.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }

    /**
     * Find the grading rule for a score.
     */
    public static function findGrade(
        int $schoolId,
        float $score
    ): ?self {

        return self::where('school_id', $schoolId)
            ->active()
            ->where('minimum_score', '<=', $score)
            ->where('maximum_score', '>=', $score)
            ->first();
    }
}
