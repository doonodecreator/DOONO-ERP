<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assignments')) return;

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('stream_id')->nullable()->constrained('streams')->nullOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['Draft', 'Published', 'Closed'])->default('Draft');
            $table->timestamps();
            $table->index(['school_id', 'class_id', 'subject_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
