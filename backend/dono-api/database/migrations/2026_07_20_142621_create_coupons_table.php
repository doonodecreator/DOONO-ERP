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
        Schema::create('coupons', function (Blueprint $table) {

            $table->id();

            $table->string('name');

            $table->string('code')->unique();

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
            | Validity
            |--------------------------------------------------------------------------
            */

            $table->date('start_date');

            $table->date('end_date');

            /*
            |--------------------------------------------------------------------------
            | Usage
            |--------------------------------------------------------------------------
            */

            $table->integer('maximum_usage')->nullable();

            $table->integer('times_used')->default(0);

            $table->integer('maximum_usage_per_school')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Restrictions
            |--------------------------------------------------------------------------
            */

            $table->boolean('first_time_only')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Coupon ↔ Subscription Plans
        |--------------------------------------------------------------------------
        */

        Schema::create('coupon_subscription_plan', function (Blueprint $table) {

            $table->id();

            $table->foreignId('coupon_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'coupon_id',
                'subscription_plan_id'
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Coupon ↔ Schools
        |--------------------------------------------------------------------------
        */

        Schema::create('coupon_school', function (Blueprint $table) {

            $table->id();

            $table->foreignId('coupon_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'coupon_id',
                'school_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_school');

        Schema::dropIfExists('coupon_subscription_plan');

        Schema::dropIfExists('coupons');
    }
};
