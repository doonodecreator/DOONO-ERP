<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('cbt_attempts', 'question_order')) {
            Schema::table('cbt_attempts', function (Blueprint $table) {
                $table->json('question_order')->nullable()->after('total_questions');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('cbt_attempts', 'question_order')) {
            Schema::table('cbt_attempts', function (Blueprint $table) {
                $table->dropColumn('question_order');
            });
        }
    }
};
