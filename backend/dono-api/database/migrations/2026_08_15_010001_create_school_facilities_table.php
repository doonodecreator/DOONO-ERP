<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('category', 50)->default('Other');
            $table->string('location')->nullable();
            $table->string('condition', 30)->default('Good');
            $table->string('status', 40)->default('Operational');
            $table->text('description')->nullable();
            $table->date('last_inspected_at')->nullable();
            $table->date('next_inspection_at')->nullable();
            $table->foreignId('responsible_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['school_id', 'status']);
            $table->index(['school_id', 'category']);
            $table->index(['school_id', 'next_inspection_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_facilities');
    }
};
