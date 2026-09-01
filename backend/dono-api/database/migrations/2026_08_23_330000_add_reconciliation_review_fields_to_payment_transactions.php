<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('payment_transactions', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('payment_transactions', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
            if (! Schema::hasColumn('payment_transactions', 'reconciliation_notes')) {
                $table->text('reconciliation_notes')->nullable()->after('reconciliation_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('payment_transactions', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
            }
            foreach (['reconciliation_notes', 'reviewed_at', 'reviewed_by'] as $column) {
                if (Schema::hasColumn('payment_transactions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
