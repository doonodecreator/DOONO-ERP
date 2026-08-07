<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links a Staff personnel record to a real User login account.
     * Nullable — a Staff record can exist without a login (e.g. imported
     * historical records), but any staff member meant to log in and use
     * the system needs this set, along with a role in user_roles.
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('school_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
