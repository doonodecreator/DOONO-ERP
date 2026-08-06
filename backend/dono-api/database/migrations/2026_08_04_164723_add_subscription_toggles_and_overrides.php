<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Global toggle on system_settings
        if (Schema::hasTable('system_settings') && !Schema::hasColumn('system_settings', 'enforce_subscriptions')) {
            Schema::table('system_settings', function (Blueprint $table) {
                $table->boolean('enforce_subscriptions')->default(false)->after('sms_notifications');
            });
        }

        // 2. School-level exemption & discount overrides on school_subscriptions
        if (Schema::hasTable('school_subscriptions')) {
            Schema::table('school_subscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('school_subscriptions', 'is_exempt')) {
                    $table->boolean('is_exempt')->default(false)->after('status');
                }
                if (!Schema::hasColumn('school_subscriptions', 'discount_percentage')) {
                    $table->integer('discount_percentage')->default(0)->after('is_exempt');
                }
                if (!Schema::hasColumn('school_subscriptions', 'discount_ends_at')) {
                    $table->timestamp('discount_ends_at')->nullable()->after('discount_percentage');
                }
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

        if (Schema::hasTable('school_subscriptions')) {
            Schema::table('school_subscriptions', function (Blueprint $table) {
                $table->dropColumn(['is_exempt', 'discount_percentage', 'discount_ends_at']);
            });
        }
    }
};
