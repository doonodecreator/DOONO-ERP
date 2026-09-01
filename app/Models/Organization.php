<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'short_name',
        'registration_number',
        'email',
        'phone',
        'alternative_phone',
        'website',
        'logo',
        'country',
        'state',
        'lga',
        'address',
        'status',
    ];

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
