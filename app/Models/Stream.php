<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stream extends Model
{
    protected $fillable = [
        'class_id',
        'name',
        'code',
        'capacity',
        'is_active',
    ];

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'stream_id');
    }
}
