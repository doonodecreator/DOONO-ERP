<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Query\Exception as QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fee_payments') || $this->hasIndex('fee_payments', 'fee_payments_transaction_ref_unique')) {
            return;
        }

        $duplicate = DB::table('fee_payments')
            ->select('transaction_reference')
            ->whereNotNull('transaction_reference')
            ->where('transaction_reference', '<>', '')
            ->groupBy('transaction_reference')
            ->havingRaw('COUNT(*) > 1')
            ->first();

        if ($duplicate) {
            throw new \RuntimeException(
                'Cannot add the fee payment transaction-reference constraint because duplicate references exist. Resolve duplicates before migrating.'
            );
        }

        Schema::table('fee_payments', function (Blueprint $table): void {
            $table->unique('transaction_reference', 'fee_payments_transaction_ref_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('fee_payments') || ! $this->hasIndex('fee_payments', 'fee_payments_transaction_ref_unique')) {
            return;
        }

        Schema::table('fee_payments', function (Blueprint $table): void {
            $table->dropUnique('fee_payments_transaction_ref_unique');
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            return count(Schema::getConnection()->select(
                "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
                [$indexName]
            )) > 0;
        } catch (QueryException) {
            return false;
        }
    }
};

