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
        Schema::create('system_settings', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Platform Information
            |--------------------------------------------------------------------------
            */

            $table->string('platform_name')
                ->default('DOONO School ERP');

            $table->string('platform_email')
                ->nullable();

            $table->string('platform_phone')
                ->nullable();

            $table->string('platform_logo')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Free Trial Settings
            |--------------------------------------------------------------------------
            */

            $table->integer('trial_days')
                ->default(240);

            $table->foreignId('default_subscription_plan_id')
                ->nullable()
                ->constrained('subscription_plans')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Default Currency
            |--------------------------------------------------------------------------
            */

            $table->foreignId('default_currency_id')
                ->nullable()
                ->constrained('currencies')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | School Registration
            |--------------------------------------------------------------------------
            */

            $table->boolean('allow_school_registration')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | Maintenance Mode
            |--------------------------------------------------------------------------
            */

            $table->boolean('maintenance_mode')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | Payment Gateways
            |--------------------------------------------------------------------------
            */

            $table->boolean('paystack_enabled')
                ->default(true);

            $table->boolean('stripe_enabled')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | Notifications
            |--------------------------------------------------------------------------
            */

            $table->boolean('email_notifications')
                ->default(true);

            $table->boolean('sms_notifications')
                ->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
