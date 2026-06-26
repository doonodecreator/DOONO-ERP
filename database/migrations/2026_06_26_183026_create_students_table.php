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
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')->constrained()->cascadeOnDelete();

            $table->foreignId('division_id')->constrained()->cascadeOnDelete();

            $table->foreignId('class_id')->constrained()->cascadeOnDelete();

            $table->foreignId('stream_id')->nullable()->constrained()->nullOnDelete();

            $table->foreignId('academic_session_id')->constrained()->cascadeOnDelete();

            $table->string('admission_number')->unique();

            $table->string('first_name');

            $table->string('middle_name')->nullable();

            $table->string('last_name');

            $table->enum('gender', ['Male', 'Female']);

            $table->date('date_of_birth');

            $table->date('admission_date');

            $table->string('photo')->nullable();

            $table->string('religion')->nullable();

            $table->string('nationality')->default('Nigeria');

            $table->string('state_of_origin')->nullable();

            $table->string('local_government')->nullable();

            $table->text('address')->nullable();

            $table->string('blood_group')->nullable();

            $table->string('genotype')->nullable();

            $table->text('medical_notes')->nullable();

            $table->enum('status', [
                'Active',
                'Graduated',
                'Transferred',
                'Suspended',
                'Withdrawn'
            ])->default('Active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
