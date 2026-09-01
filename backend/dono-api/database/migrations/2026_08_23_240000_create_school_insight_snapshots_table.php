<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('school_insight_snapshots')) {
            return;
        }

        Schema::create('school_insight_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->unsignedSmallInteger('period_days')->default(30);
            $table->unsignedInteger('active_students')->default(0);
            $table->unsignedInteger('attendance_records')->default(0);
            $table->decimal('attendance_percentage', 5, 1)->nullable();
            $table->unsignedInteger('published_result_count')->default(0);
            $table->decimal('average_published_score', 8, 1)->nullable();
            $table->json('subject_averages')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'snapshot_date', 'period_days'], 'sis_school_date_period_uq');
            $table->index(['school_id', 'snapshot_date'], 'sis_school_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_insight_snapshots');
    }
};

