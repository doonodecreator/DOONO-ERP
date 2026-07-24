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
        Schema::create('academic_configurations', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Assessment
            |--------------------------------------------------------------------------
            */

            $table->unsignedTinyInteger('pass_mark')
                ->default(40);

            $table->unsignedTinyInteger('maximum_score')
                ->default(100);

            /*
            |--------------------------------------------------------------------------
            | Ranking
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'ranking_method',
                [
                    'total_score',
                    'average_score'
                ]
            )->default('total_score');

            $table->enum(
                'tie_breaker',
                [
                    'shared_position',
                    'mathematics',
                    'english',
                    'grade_count'
                ]
            )->default('shared_position');
/*
            |--------------------------------------------------------------------------
            | Promotion
            |--------------------------------------------------------------------------
            */

            $table->unsignedTinyInteger('promotion_pass_mark')
                ->default(50);

            $table->boolean('promote_final_term_only')
                ->default(true);

            $table->boolean('automatic_promotion')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | Result Approval
            |--------------------------------------------------------------------------
            */

            $table->boolean('require_principal_approval')
                ->default(true);

            $table->boolean('lock_results_after_approval')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | Report Card
            |--------------------------------------------------------------------------
            */

            $table->boolean('show_class_position')
                ->default(true);

            $table->boolean('show_attendance')
                ->default(true);

            $table->boolean('show_behaviour_assessment')
                ->default(true);

            $table->boolean('show_skill_assessment')
                ->default(true);

            $table->boolean('show_principal_signature')
                ->default(true);

            $table->boolean('show_school_stamp')
                ->default(true);

            $table->boolean('enable_qr_verification')
                ->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_configurations');
    }
};
