<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('name');
            $table->string('exam_body')->nullable();
            $table->foreignId('academic_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('term_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->date('scheduled_date')->nullable();
            $table->unsignedInteger('candidate_count')->nullable();
            $table->string('status')->default('Planned');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->index(['school_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_activities');
    }
};
