<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->enum('leave_type', [
                'Annual',
                'Sick',
                'Maternity',
                'Paternity',
                'Compassionate',
                'Study',
                'Other',
            ]);
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->enum('status', [
                'Pending',
                'Approved',
                'Rejected',
                'Cancelled',
            ])->default('Pending');
            $table->foreignId('reviewed_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('reviewer_note')->nullable();
            $table->timestamps();

            $table->index(
                ['school_id', 'status', 'start_date'],
                'leave_requests_school_status_start_index'
            );
            $table->index(
                ['staff_id', 'start_date', 'end_date'],
                'leave_requests_staff_dates_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
