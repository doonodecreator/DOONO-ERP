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
        Schema::create('exam_scores', function (Blueprint $table) {

            $table->id();

            $table->foreignId('student_enrollment_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('class_subject_id')
                  ->constrained('class_subject')
                  ->cascadeOnDelete();

            $table->foreignId('examination_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->decimal('ca_score', 5, 2)->default(0);

            $table->decimal('exam_score', 5, 2)->default(0);

            $table->decimal('total_score', 5, 2)->default(0);

            $table->string('grade', 5)->nullable();

            $table->string('remark')->nullable();

            $table->unsignedInteger('position')->nullable();

            $table->foreignId('staff_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'class_subject_id',
                    'examination_id'
                ],
                'student_subject_exam_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_scores');
    }
};
