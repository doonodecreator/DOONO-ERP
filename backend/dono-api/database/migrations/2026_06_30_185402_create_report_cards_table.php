<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cards', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
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

            $table->decimal('total_score',8,2)->default(0);

            $table->decimal('average_score',5,2)->default(0);

            $table->integer('position')->nullable();

            $table->string('overall_grade')->nullable();

            $table->string('overall_remark')->nullable();

            $table->text('teacher_comment')->nullable();

            $table->text('principal_comment')->nullable();

            $table->string('class_teacher_name')->nullable();

            $table->string('principal_name')->nullable();

            $table->date('next_term_begins')->nullable();

            $table->enum('promotion_status',[
                'Promoted',
                'Repeat',
                'Pending',
                'Graduated'
            ])->default('Pending');

            $table->boolean('is_published')->default(false);

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'academic_session_id',
                    'term_id'
                ],
                'student_report_card_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
    }
};
