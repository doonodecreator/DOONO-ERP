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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();

            $table->foreignId('school_id')->constrained()->cascadeOnDelete();

            $table->foreignId('division_id')->constrained()->cascadeOnDelete();

            $table->string('name');

            $table->string('code')->unique();

            $table->enum('category', [
                'Core',
                'Elective'
            ])->default('Core');

            $table->integer('pass_mark')->default(40);

            $table->integer('maximum_mark')->default(100);

            $table->boolean('is_active')->default(true);

            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
