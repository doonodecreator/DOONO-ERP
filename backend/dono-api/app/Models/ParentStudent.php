<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentStudent extends Model
{
    protected $table = 'parent_student';

    protected $fillable = [
        'parent_id',
        'student_id',
        'is_primary_contact',
    ];

    protected $casts = [
        'is_primary_contact' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(
            ParentModel::class,
            'parent_id'
        );
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(
            Student::class,
            'student_id'
        );
    }
}
