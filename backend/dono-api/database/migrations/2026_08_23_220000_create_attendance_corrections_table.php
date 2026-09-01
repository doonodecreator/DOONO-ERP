<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attendance_corrections')) {
            return;
        }

        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attendance_id')->constrained('attendances')->cascadeOnDelete();
            $table->foreignId('edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('before_status', 30);
            $table->string('after_status', 30);
            $table->string('before_remarks')->nullable();
            $table->string('after_remarks')->nullable();
            $table->text('reason');
            $table->timestamps();

            $table->index(['school_id', 'attendance_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_corrections');
    }
};
