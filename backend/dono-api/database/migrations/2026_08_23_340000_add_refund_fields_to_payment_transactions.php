<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('payment_transactions', 'refund_id')) {
                $table->string('refund_id')->nullable()->after('is_refunded');
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_status')) {
                $table->string('refund_status', 30)->nullable()->after('refund_id');
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_amount')) {
                $table->decimal('refund_amount', 12, 2)->nullable()->after('refund_status');
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_response')) {
                $table->json('refund_response')->nullable()->after('refund_amount');
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_reason')) {
                $table->text('refund_reason')->nullable()->after('refund_response');
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_requested_by')) {
                $table->foreignId('refund_requested_by')->nullable()->after('refund_reason')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('payment_transactions', 'refund_requested_at')) {
                $table->timestamp('refund_requested_at')->nullable()->after('refund_requested_by');
            }
            if (! Schema::hasColumn('payment_transactions', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('refund_requested_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('payment_transactions', 'refund_requested_by')) {
                $table->dropForeign(['refund_requested_by']);
            }
            foreach (['refunded_at', 'refund_requested_at', 'refund_requested_by', 'refund_reason', 'refund_response', 'refund_amount', 'refund_status', 'refund_id'] as $column) {
                if (Schema::hasColumn('payment_transactions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
