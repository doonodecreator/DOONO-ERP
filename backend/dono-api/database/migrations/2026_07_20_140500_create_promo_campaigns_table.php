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
        Schema::create('promo_campaigns', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Campaign Information
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->string('slug')->unique();

            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Discount
            |--------------------------------------------------------------------------
            */

            $table->enum('discount_type', [
                'percentage',
                'fixed',
            ]);

            $table->decimal('discount_value', 12, 2);

            /*
            |--------------------------------------------------------------------------
            | Duration
            |--------------------------------------------------------------------------
            */

            $table->dateTime('start_date');

            $table->dateTime('end_date');

            /*
            |--------------------------------------------------------------------------
            | Usage
            |--------------------------------------------------------------------------
            */

            $table->integer('maximum_usage')->nullable();

            $table->integer('times_used')->default(0);

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')->default(true);

            $table->boolean('auto_activate')->default(true);

            $table->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Attach Promo Campaigns to Subscription Plans
        |--------------------------------------------------------------------------
        */

        Schema::create('promo_campaign_subscription_plan', function (Blueprint $table) {

            $table->id();

            $table->foreignId('promo_campaign_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'promo_campaign_id',
                'subscription_plan_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promo_campaign_subscription_plan');

        Schema::dropIfExists('promo_campaigns');
    }
};
