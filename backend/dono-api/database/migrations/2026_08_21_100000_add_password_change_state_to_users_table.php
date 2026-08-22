<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'must_change_password')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('must_change_password')->default(false)->after('password');
            });
        }

        if (! Schema::hasColumn('users', 'password_changed_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('password_changed_at')->nullable()->after('must_change_password');
            });
        }
    }

    public function down(): void
    {
        $columns = array_filter([
            Schema::hasColumn('users', 'password_changed_at') ? 'password_changed_at' : null,
            Schema::hasColumn('users', 'must_change_password') ? 'must_change_password' : null,
        ]);

        if ($columns) {
            Schema::table('users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }
};
