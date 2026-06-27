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
        Schema::create('fee_payments', function (Blueprint $table) {

            $table->id();

            $table->foreignId('student_fee_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('staff_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->string('receipt_number')->unique();

            $table->decimal('amount_paid', 12, 2);

            $table->date('payment_date');

            $table->enum('payment_method', [
                'Cash',
                'Bank Transfer',
                'POS',
                'Cheque',
                'Online'
            ]);

            $table->string('transaction_reference')->nullable();

            $table->string('bank_name')->nullable();

            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
    }
};
