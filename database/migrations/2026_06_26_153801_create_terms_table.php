<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terms', function (Blueprint $table) {

            $table->id();

            $table->foreignId('academic_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('name', [
                'First Term',
                'Second Term',
                'Third Term',
            ]);

            $table->date('start_date');

            $table->date('end_date');

            $table->boolean('is_current')->default(false);

            $table->enum('status', [
                'active',
                'closed',
            ])->default('active');

            $table->timestamps();

            $table->unique(['academic_session_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terms');
    }
};
