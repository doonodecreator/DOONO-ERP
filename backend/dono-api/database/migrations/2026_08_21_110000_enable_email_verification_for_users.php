<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            });
        }

        DB::table('users')
            ->whereNull('email_verified_at')
            ->whereNotNull('created_at')
            ->where('created_at', '<', now())
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Keep the standard Laravel email_verified_at column on rollback.
    }
};
