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
        Schema::create('student_promotions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('from_academic_session_id')
                ->constrained('academic_sessions')
                ->cascadeOnDelete();

            $table->foreignId('to_academic_session_id')
                ->constrained('academic_sessions')
                ->cascadeOnDelete();

            $table->foreignId('from_division_id')
                ->constrained('divisions')
                ->cascadeOnDelete();

            $table->foreignId('to_division_id')
                ->constrained('divisions')
                ->cascadeOnDelete();

            $table->foreignId('from_class_id')
                ->constrained('classes')
                ->cascadeOnDelete();

            $table->foreignId('to_class_id')
                ->constrained('classes')
                ->cascadeOnDelete();

            $table->foreignId('from_stream_id')
                ->nullable()
                ->constrained('streams')
                ->nullOnDelete();

            $table->foreignId('to_stream_id')
                ->nullable()
                ->constrained('streams')
                ->nullOnDelete();

            $table->date('promotion_date');

            $table->enum('promotion_status', [
                'Promoted',
                'Repeated',
                'Transferred',
                'Graduated'
            ]);

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'student_id',
                    'to_academic_session_id'
                ],
                'student_promotion_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_promotions');
    }
};
