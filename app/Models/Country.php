<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = [

        'name',

        'iso2',

        'iso3',

        'phone_code',

        'timezone',

        'locale',

        'currency_id',

        'is_active',
    ];

    protected $casts = [

        'is_active' => 'boolean',
    ];

    /**
     * Default currency for this country.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Schools located in this country.
     */
    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
