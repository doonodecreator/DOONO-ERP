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
        Schema::create('student_fees', function (Blueprint $table) {

            $table->id();

            $table->foreignId('student_enrollment_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('fee_category_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('term_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->decimal('amount', 12, 2);

            $table->decimal('discount', 12, 2)->default(0);

            $table->decimal('amount_due', 12, 2);

            $table->date('due_date')->nullable();

            $table->enum('status', [
                'Pending',
                'Partial',
                'Paid',
                'Waived'
            ])->default('Pending');

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'student_enrollment_id',
                    'fee_category_id',
                    'academic_session_id',
                    'term_id'
                ],
                'student_fee_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_fees');
    }
};
