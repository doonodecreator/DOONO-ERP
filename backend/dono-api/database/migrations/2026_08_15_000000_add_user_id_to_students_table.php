<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('students', 'user_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('school_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasIndex('students', 'students_user_id_unique')) {
            Schema::table('students', function (Blueprint $table) {
                $table->unique('user_id', 'students_user_id_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique('students_user_id_unique');
            $table->dropColumn('user_id');
        });
    }
};
