<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_payments', function (Blueprint $table): void {
            if (! Schema::hasColumn('fee_payments', 'reversed_at')) {
                $table->timestamp('reversed_at')->nullable()->after('remarks');
            }
            if (! Schema::hasColumn('fee_payments', 'reversed_by')) {
                $table->foreignId('reversed_by')->nullable()->after('reversed_at')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('fee_payments', 'reversal_reason')) {
                $table->text('reversal_reason')->nullable()->after('reversed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fee_payments', function (Blueprint $table): void {
            if (Schema::hasColumn('fee_payments', 'reversed_by')) {
                $table->dropForeign(['reversed_by']);
            }
            foreach (['reversal_reason', 'reversed_by', 'reversed_at'] as $column) {
                if (Schema::hasColumn('fee_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
