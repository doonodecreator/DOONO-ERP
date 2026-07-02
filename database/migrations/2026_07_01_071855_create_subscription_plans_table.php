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
        Schema::create('subscription_plans', function (Blueprint $table) {

            $table->id();

            $table->string('name');

            $table->string('slug')->unique();

            $table->text('description')->nullable();

            /*
             |--------------------------------------------------------------
             | Base Prices
             |--------------------------------------------------------------
             */

            $table->decimal('monthly_price', 12, 2)->default(0);

            $table->decimal('quarterly_price', 12, 2)->default(0);

            $table->decimal('half_yearly_price', 12, 2)->default(0);

            $table->decimal('yearly_price', 12, 2)->default(0);

            /*
             |--------------------------------------------------------------
             | Base Currency
             |--------------------------------------------------------------
             */

            $table->string('currency', 10)->default('USD');

            /*
             |--------------------------------------------------------------
             | Limits
             |--------------------------------------------------------------
             */

            $table->integer('max_students')->nullable();

            $table->integer('max_staff')->nullable();

            $table->integer('max_branches')->default(1);

            /*
             |--------------------------------------------------------------
             | Features
             |--------------------------------------------------------------
             */

            $table->json('features')->nullable();

            /*
             |--------------------------------------------------------------
             | Trial
             |--------------------------------------------------------------
             */

            $table->integer('trial_days')->default(240);

            /*
             |--------------------------------------------------------------
             | Status
             |--------------------------------------------------------------
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
        Schema::dropIfExists('subscription_plans');
    }
};
