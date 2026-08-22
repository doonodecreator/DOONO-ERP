<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cbt_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('examination_id')->nullable()->constrained('examinations')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->text('question');
            $table->json('options');
            $table->string('correct_answer', 255);
            $table->unsignedInteger('marks')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['school_id', 'examination_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cbt_questions');
    }
};
