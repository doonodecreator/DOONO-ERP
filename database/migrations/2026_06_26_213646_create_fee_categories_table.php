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
        Schema::create('fee_categories', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->string('name');

            $table->string('code')->unique();

            $table->text('description')->nullable();

            $table->decimal('default_amount', 12, 2)->default(0);

            $table->enum('frequency', [
                'One Time',
                'Termly',
                'Sessional',
                'Monthly'
            ])->default('Termly');

            $table->boolean('is_mandatory')->default(true);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_categories');
    }
};
