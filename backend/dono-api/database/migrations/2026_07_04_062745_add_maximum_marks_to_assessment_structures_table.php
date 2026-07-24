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
        if (!Schema::hasColumn('assessment_structures', 'maximum_marks')) {
            Schema::table('assessment_structures', function (Blueprint $table) {
                $table->unsignedSmallInteger('maximum_marks')
                    ->default(100)
                    ->after('name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('assessment_structures', 'maximum_marks')) {
            Schema::table('assessment_structures', function (Blueprint $table) {
                $table->dropColumn('maximum_marks');
            });
        }
    }
};
