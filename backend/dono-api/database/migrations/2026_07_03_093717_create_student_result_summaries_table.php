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
        Schema::create('student_result_summaries', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('class_id')
    ->constrained('classes')
    ->cascadeOnDelete();

            $table->foreignId('student_enrollment_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('term_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Academic Summary
            |--------------------------------------------------------------------------
            */

            $table->decimal('total_score', 8, 2)->default(0);

            $table->decimal('student_average', 6, 2)->default(0);

            $table->unsignedInteger('position')->nullable();

            $table->unsignedInteger('subjects_offered')->default(0);

            $table->unsignedInteger('subjects_passed')->default(0);

            $table->unsignedInteger('subjects_failed')->default(0);

            /*
            |--------------------------------------------------------------------------
            | Overall Grade
            |--------------------------------------------------------------------------
            */

            $table->string('overall_grade')->nullable();

            $table->string('overall_remark')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Class Statistics
            |--------------------------------------------------------------------------
            */

            $table->decimal('class_average', 6, 2)->default(0);

            $table->decimal('highest_average', 6, 2)->default(0);

            $table->decimal('lowest_average', 6, 2)->default(0);

            /*
            |--------------------------------------------------------------------------
            | Promotion
            |--------------------------------------------------------------------------
            */

            $table->string('promotion_status')
                ->default('Pending');

            /*
            |--------------------------------------------------------------------------
            | Remarks
            |--------------------------------------------------------------------------
            */

            $table->text('class_teacher_remark')
                ->nullable();

            $table->text('principal_remark')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Approval & Publishing
            |--------------------------------------------------------------------------
            */

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')
                ->nullable();

            $table->boolean('is_published')
                ->default(false);

            $table->timestamp('published_at')
                ->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'academic_session_id',
                    'term_id'
                ],
                'student_term_summary_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_result_summaries');
    }
};
