<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->foreignId('parent_id')
                ->nullable()
                ->after('user_id')
                ->constrained('parents')
                ->nullOnDelete();

            $table->unique('parent_id', 'guardians_parent_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropUnique('guardians_parent_id_unique');
            $table->dropColumn('parent_id');
        });
    }
};
