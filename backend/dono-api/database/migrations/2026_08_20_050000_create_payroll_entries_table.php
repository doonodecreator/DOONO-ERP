<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained()->cascadeOnDelete();
            $table->string('pay_period', 7);
            $table->decimal('gross_amount', 14, 2);
            $table->decimal('deductions', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2);
            $table->string('status')->default('Draft');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['school_id', 'staff_id', 'pay_period']);
            $table->index(['school_id', 'status', 'pay_period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_entries');
    }
};
