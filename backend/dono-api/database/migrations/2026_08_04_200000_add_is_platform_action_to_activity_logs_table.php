<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Distinguishes platform-admin actions from school-level actions.
     * true  = performed by a super_admin (software owner) — visible only
     *         in the platform owner's own audit view.
     * false = performed by a school-level user (Proprietor, Principal,
     *         staff, etc.) — visible in that school's audit log AND
     *         rolled up into the platform owner's "what schools are
     *         doing" view.
     */
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->boolean('is_platform_action')->default(false)->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn('is_platform_action');
        });
    }
};
