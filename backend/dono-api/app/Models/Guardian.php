<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
    ];

    // A guardian can have many students
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class)
                    ->withPivot('relation_type')
                    ->withTimestamps();
    }
}

