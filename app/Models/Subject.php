<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_core',
        'is_active',
    ];

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(
            ClassModel::class,
            'class_subject',
            'subject_id',
            'class_id'
        );
    }

    public function examScores(): HasMany
    {
        return $this->hasMany(ExamScore::class);
    }
}
