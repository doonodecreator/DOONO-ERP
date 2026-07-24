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
        Schema::create('grading_systems', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Grade Range
            |--------------------------------------------------------------------------
            */

            $table->unsignedTinyInteger('minimum_score');

            $table->unsignedTinyInteger('maximum_score');

            $table->string('grade',10);

            $table->string('remark');

            $table->decimal(
                'grade_point',
                3,
                2
            )->default(0);
/*
            |--------------------------------------------------------------------------
            | Settings
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedSmallInteger('display_order')
                ->default(1);

            $table->timestamps();

            $table->unique(
                [
                    'school_id',
                    'minimum_score',
                    'maximum_score'
                ],
                'grading_system_range_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grading_systems');
    }
};
