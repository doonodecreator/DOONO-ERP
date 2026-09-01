<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('staff_contracts')) {
            return;
        }

        Schema::create('staff_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->string('contract_number', 80);
            $table->string('employment_type', 30)->default('full_time');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('base_salary', 14, 2);
            $table->json('allowances')->nullable();
            $table->string('currency', 3)->default('NGN');
            $table->string('status', 30)->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->unique(['school_id', 'contract_number'], 'scontract_school_number_uq');
            $table->index(['school_id', 'staff_id', 'status'], 'scontract_school_staff_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_contracts');
    }
};
