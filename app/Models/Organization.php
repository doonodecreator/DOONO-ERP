<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'website',
        'logo',
        'status',
    ];

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
