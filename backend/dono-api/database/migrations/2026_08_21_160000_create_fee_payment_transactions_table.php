<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_fee_id')->constrained('student_fees')->cascadeOnDelete();
            $table->string('gateway', 30)->default('paystack');
            $table->string('reference')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->enum('status', ['pending', 'successful', 'failed', 'cancelled'])->default('pending');
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'status']);
            $table->index(['student_fee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payment_transactions');
    }
};
