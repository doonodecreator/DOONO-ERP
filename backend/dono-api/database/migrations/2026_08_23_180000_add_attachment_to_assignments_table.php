<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('assignments', 'attachment_url')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->string('attachment_url', 2048)->nullable()->after('description');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('assignments', 'attachment_url')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->dropColumn('attachment_url');
            });
        }
    }
};
