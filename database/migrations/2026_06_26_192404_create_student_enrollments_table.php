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
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('school_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('term_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('division_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('class_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('stream_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->date('enrollment_date');

            $table->enum('status', [
                'Active',
                'Promoted',
                'Repeated',
                'Graduated',
                'Transferred',
                'Withdrawn'
            ])->default('Active');

            $table->timestamps();

            $table->unique(
                [
                    'student_id',
                    'academic_session_id',
                    'term_id'
                ],
                'student_session_term_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
