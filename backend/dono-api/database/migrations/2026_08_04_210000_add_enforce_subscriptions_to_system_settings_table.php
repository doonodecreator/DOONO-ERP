<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Global master switch.
     * false = every school uses the platform free until subscriptions
     * are enabled.
     * true = enforce subscription checks.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('system_settings', 'enforce_subscriptions')) {
            Schema::table('system_settings', function (Blueprint $table) {
                $table->boolean('enforce_subscriptions')
                    ->default(false)
                    ->after('maintenance_mode');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('system_settings', 'enforce_subscriptions')) {
            Schema::table('system_settings', function (Blueprint $table) {
                $table->dropColumn('enforce_subscriptions');
            });
        }
    }
};
