<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->enum('status', [
                'Present',
                'Absent',
                'Late',
                'Excused',
            ])->default('Present');
            $table->time('check_in_at')->nullable();
            $table->time('check_out_at')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['staff_id', 'attendance_date'],
                'staff_attendance_daily_unique'
            );
            $table->index(
                ['school_id', 'attendance_date'],
                'staff_attendance_school_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_attendances');
    }
};
