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
        Schema::create('school_subscriptions', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('start_date');

            $table->date('expiry_date');

            $table->date('trial_ends_at')->nullable();

            $table->date('next_billing_date')->nullable();

            $table->enum('billing_cycle', [
                'monthly',
                'quarterly',
                'half_yearly',
                'yearly'
            ])->default('yearly');

            $table->enum('status', [
                'trial',
                'active',
                'expired',
                'cancelled'
            ])->default('trial');

            $table->decimal('amount_paid', 12, 2)
                ->default(0);

            $table->string('currency', 10)
                ->default('USD');

            $table->string('payment_reference')
                ->nullable();

            $table->boolean('auto_renew')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | Indicates whether this is the current subscription.
            | This allows us to keep full subscription history.
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_current')
                ->default(true);

            $table->timestamps();

            $table->index('school_id');

            $table->index('status');

            $table->index('expiry_date');

            $table->index('trial_ends_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_subscriptions');
    }
};	
