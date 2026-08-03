<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * schools.country_id (FK, NOT NULL) is already the correct, authoritative
     * column — set up properly in 2026_07_01_155929_add_country_id_to_schools_table.
     * The later migration 2026_08_02_131756_add_country_to_schools_table added a
     * redundant `country` string column on top of it. This removes that duplicate.
     */
    public function up(): void
    {
        if (Schema::hasColumn('schools', 'country')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->dropColumn('country');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('schools', 'country')) {
            Schema::table('schools', function (Blueprint $table) {
                $table->string('country')->nullable();
            });
        }
    }
};
