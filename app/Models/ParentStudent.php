<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentStudent extends Model
{
    protected $table = 'parent_student';

    public $timestamps = false;

    protected $fillable = [
        'parent_id',
        'student_id',
        'relationship',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Parents::class, 'parent_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
