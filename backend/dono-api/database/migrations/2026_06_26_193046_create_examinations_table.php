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
        Schema::create('examinations', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('term_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('name');

            $table->enum('exam_type', [
                'CA1',
                'CA2',
                'Mid-Term',
                'Examination',
                'Mock',
                'Promotion',
                'Other'
            ]);

            $table->unsignedInteger('total_marks')->default(100);

            $table->date('start_date');

            $table->date('end_date');

            $table->enum('status', [
                'Draft',
                'Scheduled',
                'Ongoing',
                'Completed'
            ])->default('Draft');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('examinations');
    }
};
