<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {

            $table->id();

            $table->string('name');

            $table->string('code', 3)->unique();

            $table->string('symbol', 10);

            /*
            |--------------------------------------------------------------------------
            | Exchange rate against the base currency (USD)
            |--------------------------------------------------------------------------
            |
            | USD = 1.000000
            | NGN = 1550.000000
            | GHS = 10.400000
            | GBP = 0.740000
            |
            */

            $table->decimal('exchange_rate', 20, 6);

            /*
            |--------------------------------------------------------------------------
            | Only one currency should be the system base currency.
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_base')->default(false);

            /*
            |--------------------------------------------------------------------------
            | Enable or disable a currency.
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
