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
        Schema::create('payment_transactions', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('school_subscription_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Gateway
            |--------------------------------------------------------------------------
            */

            $table->enum('gateway', [
                'paystack',
                'stripe'
            ]);

            /*
            |--------------------------------------------------------------------------
            | References
            |--------------------------------------------------------------------------
            */

            $table->string('reference')->unique();

            $table->string('gateway_transaction_id')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Amount
            |--------------------------------------------------------------------------
            */

            $table->decimal('amount', 12, 2);

            $table->string('currency', 10);

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [

                'pending',

                'successful',

                'failed',

                'cancelled',

                'refunded'
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | Gateway response
            |--------------------------------------------------------------------------
            */

            $table->json('gateway_response')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            $table->timestamp('paid_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Failure
            |--------------------------------------------------------------------------
            */

            $table->text('failure_reason')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Refund
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_refunded')
                ->default(false);

            $table->timestamps();

            $table->index('reference');
            $table->index('status');
            $table->index('gateway');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
