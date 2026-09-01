<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payroll_entries')) {
            return;
        }

        Schema::table('payroll_entries', function (Blueprint $table) {
            if (! Schema::hasColumn('payroll_entries', 'contract_id')) {
                $table->foreignId('contract_id')->nullable()->after('staff_id')->constrained('staff_contracts')->nullOnDelete();
            }
            if (! Schema::hasColumn('payroll_entries', 'allowances')) {
                $table->json('allowances')->nullable()->after('deductions');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('payroll_entries')) {
            return;
        }
        Schema::table('payroll_entries', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_entries', 'contract_id')) $table->dropForeign(['contract_id']);
            $columns = collect(['contract_id', 'allowances'])->filter(fn (string $column) => Schema::hasColumn('payroll_entries', $column))->values()->all();
            if ($columns) $table->dropColumn($columns);
        });
    }
};
