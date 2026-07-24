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
        Schema::create('results', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('student_enrollment_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subject_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('term_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->decimal('ca_score',5,2)->default(0);

            $table->decimal('exam_score',5,2)->default(0);

            $table->decimal('total_score',5,2)->default(0);

            $table->string('grade')->nullable();

            $table->string('remark')->nullable();

            $table->integer('position')->nullable();

            $table->boolean('is_published')->default(false);

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'subject_id',
                    'academic_session_id',
                    'term_id'
                ],
                'student_subject_result_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
