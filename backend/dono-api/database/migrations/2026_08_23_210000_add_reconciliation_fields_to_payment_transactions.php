<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_transactions', 'gateway_event_id')) {
                $table->string('gateway_event_id')->nullable()->unique()->after('gateway_transaction_id');
            }
            if (! Schema::hasColumn('payment_transactions', 'reconciliation_status')) {
                $table->string('reconciliation_status', 20)->default('pending')->after('status');
            }
            if (! Schema::hasColumn('payment_transactions', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('payment_transactions', 'gateway_event_id')) $table->dropUnique(['gateway_event_id']);
            if (Schema::hasColumn('payment_transactions', 'gateway_event_id')) $table->dropColumn('gateway_event_id');
            if (Schema::hasColumn('payment_transactions', 'reconciliation_status')) $table->dropColumn('reconciliation_status');
            if (Schema::hasColumn('payment_transactions', 'verified_at')) $table->dropColumn('verified_at');
        });
    }
};
