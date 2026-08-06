<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Proprietor Settings (School Identity & Financial Defaults)
        Schema::create('school_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('receipt_prefix')->default('REC');
            $table->string('sms_sender_id')->nullable();
            $table->string('stamp_path')->nullable();
            $table->string('motto')->nullable();
            $table->timestamps();
        });

        // 2. Principal Settings (Academic Rules & Report Card Layout)
        Schema::create('academic_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->boolean('show_position_on_report')->default(true);
            $table->boolean('show_class_average_on_report')->default(true);
            $table->boolean('show_subject_position')->default(true);
            $table->string('principal_signature_path')->nullable();
            $table->string('default_report_card_layout')->default('standard'); // standard, modern, compact
            $table->decimal('pass_mark_percentage', 5, 2)->default(40.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_settings');
        Schema::dropIfExists('school_settings');
    }
};
