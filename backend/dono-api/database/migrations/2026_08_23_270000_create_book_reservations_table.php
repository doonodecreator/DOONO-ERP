<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('book_reservations')) {
            return;
        }

        Schema::create('book_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('book_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->timestamp('requested_at');
            $table->string('status', 30)->default('pending');
            $table->timestamp('fulfilled_at')->nullable();
            $table->foreignId('fulfilled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'status'], 'bres_school_status_idx');
            $table->index(['book_id', 'status'], 'bres_book_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_reservations');
    }
};
