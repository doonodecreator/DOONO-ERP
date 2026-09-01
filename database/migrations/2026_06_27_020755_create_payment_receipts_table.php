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
        Schema::create('payment_receipts', function (Blueprint $table) {

            $table->id();

            $table->foreignId('fee_payment_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('receipt_number')->unique();

            $table->string('issued_by')->nullable();

            $table->dateTime('issued_at');

            $table->boolean('printed')->default(false);

            $table->dateTime('printed_at')->nullable();

            $table->boolean('emailed')->default(false);

            $table->dateTime('emailed_at')->nullable();

            $table->boolean('cancelled')->default(false);

            $table->text('cancellation_reason')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_receipts');
    }
};
