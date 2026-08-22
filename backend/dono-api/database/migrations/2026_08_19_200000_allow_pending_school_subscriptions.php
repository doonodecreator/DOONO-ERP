<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('school_subscriptions')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE school_subscriptions MODIFY start_date DATE NULL");
            DB::statement("ALTER TABLE school_subscriptions MODIFY expiry_date DATE NULL");
            DB::statement("ALTER TABLE school_subscriptions MODIFY status ENUM('pending','trial','active','expired','cancelled') NOT NULL DEFAULT 'pending'");
        } else {
            Schema::table('school_subscriptions', function (Blueprint $table) {
                $table->date('start_date')->nullable()->change();
                $table->date('expiry_date')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        // Existing pending rows must be resolved before reverting this schema change.
    }
};

