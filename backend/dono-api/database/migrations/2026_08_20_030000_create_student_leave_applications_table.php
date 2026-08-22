<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_leave_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('leave_type')->default('Other');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->string('status')->default('Pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('reviewer_note')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'student_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_leave_applications');
    }
};
