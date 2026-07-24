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
        Schema::table('assessment_structures', function (Blueprint $table) {

            $table->unsignedInteger('maximum_marks')
                ->default(100)
                ->after('percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_structures', function (Blueprint $table) {

            $table->dropColumn('maximum_marks');
        });
    }
};
