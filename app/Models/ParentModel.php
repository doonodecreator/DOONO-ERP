<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ParentModel extends Model
{
    protected $table = 'parents';

    protected $fillable = [
        'school_id',
        'father_name',
        'father_phone',
        'father_email',
        'father_occupation',
        'mother_name',
        'mother_phone',
        'mother_email',
        'mother_occupation',
        'guardian_name',
        'guardian_phone',
        'guardian_email',
        'guardian_occupation',
        'guardian_relationship',
        'address',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            Student::class,
            'parent_student',
            'parent_id',
            'student_id'
        );
    }
}
