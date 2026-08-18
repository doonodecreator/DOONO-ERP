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
        if (!Schema::hasColumn('users', 'current_school_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('current_school_id')
                    ->nullable()
                    ->after('password')
                    ->constrained('schools')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_school_id']);
            $table->dropColumn('current_school_id');
        });
    }
};
