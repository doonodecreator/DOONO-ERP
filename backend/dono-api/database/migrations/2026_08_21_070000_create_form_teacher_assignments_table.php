<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('stream_id')->nullable()->constrained('streams')->nullOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['school_id', 'staff_id', 'is_active'], 'form_teacher_staff_active_index');
            $table->index(['school_id', 'class_id', 'stream_id'], 'form_teacher_class_stream_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_teacher_assignments');
    }
};
