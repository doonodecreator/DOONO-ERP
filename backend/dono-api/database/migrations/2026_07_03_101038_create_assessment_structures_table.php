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
        Schema::create('assessment_structures', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Assessment Component
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->unsignedTinyInteger('percentage');

            $table->unsignedSmallInteger('display_order')
                ->default(1);

            $table->boolean('is_active')
                ->default(true);
$table->timestamps();

            $table->unique(
                [
                    'school_id',
                    'name'
                ],
                'assessment_structure_name_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_structures');
    }
};
