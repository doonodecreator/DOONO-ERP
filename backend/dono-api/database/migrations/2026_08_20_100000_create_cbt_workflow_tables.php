<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cbt_questions')) {
            Schema::table('cbt_questions', function (Blueprint $table) {
                if (!Schema::hasColumn('cbt_questions', 'approval_status')) {
                    $table->string('approval_status', 20)->default('draft')->after('is_active');
                    $table->foreignId('reviewed_by')->nullable()->after('approval_status')->constrained('users')->nullOnDelete();
                    $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
                    $table->text('review_note')->nullable()->after('reviewed_at');
                }
            });
        }

        Schema::create('cbt_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('examination_id')->nullable()->constrained('examinations')->nullOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('term_id')->constrained('terms')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assessment_structure_id')->nullable()->constrained('assessment_structures')->nullOnDelete();
            $table->foreignId('result_submission_id')->nullable()->constrained('result_submissions')->nullOnDelete();
            $table->foreignId('results_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->unsignedInteger('total_marks')->default(0);
            $table->unsignedInteger('pass_mark')->default(0);
            $table->unsignedTinyInteger('result_weight')->default(100);
            $table->unsignedInteger('max_attempts')->default(1);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->string('status', 20)->default('draft');
            $table->string('results_status', 20)->default('draft');
            $table->boolean('shuffle_questions')->default(false);
            $table->timestamp('results_reviewed_at')->nullable();
            $table->timestamp('results_published_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'class_id', 'status']);
            $table->index(['school_id', 'available_from', 'available_until']);
        });

        Schema::create('cbt_assessment_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_assessment_id')->constrained('cbt_assessments')->cascadeOnDelete();
            $table->foreignId('cbt_question_id')->constrained('cbt_questions')->restrictOnDelete();
            $table->unsignedInteger('display_order')->default(1);
            $table->unsignedInteger('marks')->default(1);
            $table->text('question_snapshot');
            $table->json('options_snapshot');
            $table->string('correct_answer_snapshot');
            $table->timestamps();
            $table->unique(['cbt_assessment_id', 'cbt_question_id'], 'cbt_assessment_question_unique');
            $table->index(['cbt_assessment_id', 'display_order']);
        });

        Schema::create('cbt_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cbt_assessment_id')->constrained('cbt_assessments')->cascadeOnDelete();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('status', 20)->default('not_started');
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('total_questions')->default(0);
            $table->decimal('score', 10, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->timestamps();
            $table->unique(['cbt_assessment_id', 'student_enrollment_id', 'attempt_number'], 'cbt_attempt_student_unique');
            $table->index(['school_id', 'student_enrollment_id', 'status']);
        });

        Schema::create('cbt_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cbt_attempt_id')->constrained('cbt_attempts')->cascadeOnDelete();
            $table->foreignId('cbt_assessment_question_id')->constrained('cbt_assessment_questions')->cascadeOnDelete();
            $table->text('selected_answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('awarded_marks', 10, 2)->default(0);
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
            $table->unique(['cbt_attempt_id', 'cbt_assessment_question_id'], 'cbt_attempt_answer_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_attempt_answers');
        Schema::dropIfExists('cbt_attempts');
        Schema::dropIfExists('cbt_assessment_questions');
        Schema::dropIfExists('cbt_assessments');

        if (Schema::hasTable('cbt_questions') && Schema::hasColumn('cbt_questions', 'approval_status')) {
            Schema::table('cbt_questions', function (Blueprint $table) {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn(['approval_status', 'reviewed_by', 'reviewed_at', 'review_note']);
            });
        }
    }
};
