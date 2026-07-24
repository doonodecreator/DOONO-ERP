<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = [

        'name',

        'code',

        'symbol',

        'exchange_rate',

        'is_base',

        'is_active',
    ];

    protected $casts = [

        'exchange_rate' => 'decimal:6',

        'is_base' => 'boolean',

        'is_active' => 'boolean',
    ];

    /**
     * Convert an amount from the base currency (USD)
     * into this currency.
     */
    public function convertFromBase(float $amount): float
    {
        return round(
            $amount * $this->exchange_rate,
            2
        );
    }

    /**
     * Convert an amount in this currency
     * back to the base currency.
     */
    public function convertToBase(float $amount): float
    {
        if ($this->exchange_rate == 0) {
            return 0;
        }

        return round(
            $amount / $this->exchange_rate,
            2
        );
    }

    /**
     * Get the system base currency.
     */
    public static function base(): ?self
    {
        return self::where('is_base', true)->first();
    }

    /**
     * Get an active currency by code.
     */
    public static function byCode(string $code): ?self
    {
        return self::where('code', strtoupper($code))
            ->where('is_active', true)
            ->first();
    }
}
