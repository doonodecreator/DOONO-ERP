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
        Schema::create('attendances', function (Blueprint $table) {

            $table->id();

            $table->foreignId('student_enrollment_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('term_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->date('attendance_date');

            $table->enum('status', [
                'Present',
                'Absent',
                'Late',
                'Excused'
            ])->default('Present');

            $table->text('remarks')->nullable();

            $table->foreignId('staff_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'attendance_date'
                ],
                'student_attendance_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
