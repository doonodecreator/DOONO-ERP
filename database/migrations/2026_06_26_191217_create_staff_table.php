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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')->constrained()->cascadeOnDelete();

            $table->string('staff_number')->unique();

            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->enum('gender', ['Male', 'Female']);

            $table->date('date_of_birth')->nullable();

            $table->string('phone');
            $table->string('email')->nullable();

            $table->text('address')->nullable();

            $table->string('designation');
            $table->string('department')->nullable();

            $table->date('employment_date');

            $table->decimal('basic_salary', 12, 2)->default(0);

            $table->string('qualification')->nullable();

            $table->string('photo')->nullable();

            $table->enum('employment_status', [
                'Active',
                'Suspended',
                'Retired',
                'Resigned',
                'Terminated'
            ])->default('Active');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
