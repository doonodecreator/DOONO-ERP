<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'display_name',
    ];

    /*
    |--------------------------------------------------------------------------
    | School
    |--------------------------------------------------------------------------
    */

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Students
    |--------------------------------------------------------------------------
    */

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            Student::class,
            'parent_student',
            'parent_id',
            'student_id'
        )
        ->withPivot([
            'relationship_type',
            'is_primary_contact',
        ])
        ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | ParentStudent Records
    |--------------------------------------------------------------------------
    */

    public function parentStudents(): HasMany
    {
        return $this->hasMany(
            ParentStudent::class,
            'parent_id'
        );
    }

    public function guardian(): HasOne
    {
        return $this->hasOne(Guardian::class, 'parent_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Helper
    |--------------------------------------------------------------------------
    */

    public function getDisplayNameAttribute(): string
    {
        if (!empty($this->father_name)) {
            return $this->father_name;
        }

        if (!empty($this->mother_name)) {
            return $this->mother_name;
        }

        if (!empty($this->guardian_name)) {
            return $this->guardian_name;
        }

        return 'Unnamed Parent';
    }
}

