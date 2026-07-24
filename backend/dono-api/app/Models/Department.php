<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Department extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(
            Subject::class,
            'department_subject',
            'department_id',
            'subject_id'
        );
    }
}
