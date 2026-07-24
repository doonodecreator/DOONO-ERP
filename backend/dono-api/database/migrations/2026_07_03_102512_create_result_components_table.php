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
        Schema::create('result_components', function (Blueprint $table) {

            $table->id();

            $table->foreignId('result_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('assessment_structure_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Score
            |--------------------------------------------------------------------------
            */

            $table->decimal(
                'score',
                6,
                2
            )->default(0);

            $table->decimal(
                'weighted_score',
                6,
                2
            )->default(0);
/*
            |--------------------------------------------------------------------------
            | Audit Trail
            |--------------------------------------------------------------------------
            */

            $table->foreignId('entered_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('submitted_at')
                ->nullable();

            $table->timestamps();

            $table->unique(
                [
                    'result_id',
                    'assessment_structure_id'
                ],
                'result_component_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('result_components');
    }
};
