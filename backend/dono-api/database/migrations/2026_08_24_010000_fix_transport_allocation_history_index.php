<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = DB::select(
            "SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transport_allocations'
             GROUP BY INDEX_NAME, NON_UNIQUE"
        );

        foreach ($indexes as $index) {
            if ((int) $index->NON_UNIQUE === 0 && $index->columns_list === 'student_id') {
                Schema::table('transport_allocations', function (Blueprint $table) use ($index): void {
                    $table->dropIndex($index->INDEX_NAME);
                });
            }
        }

        $hasReplacementIndex = collect($indexes)->contains(
            fn ($index) => $index->INDEX_NAME === 'transport_allocations_school_student_status_idx'
        );

        if (! $hasReplacementIndex) {
            Schema::table('transport_allocations', function (Blueprint $table): void {
                $table->index(
                    ['school_id', 'student_id', 'status'],
                    'transport_allocations_school_student_status_idx'
                );
            });
        }
    }

    public function down(): void
    {
        $replacementExists = DB::selectOne(
            "SELECT COUNT(*) AS aggregate
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'transport_allocations'
               AND INDEX_NAME = 'transport_allocations_school_student_status_idx'"
        );

        if ((int) ($replacementExists->aggregate ?? 0) > 0) {
            Schema::table('transport_allocations', function (Blueprint $table): void {
                $table->dropIndex('transport_allocations_school_student_status_idx');
            });
        }

        $duplicateStudents = DB::table('transport_allocations')
            ->select('student_id')
            ->groupBy('student_id')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $duplicateStudents) {
            Schema::table('transport_allocations', function (Blueprint $table): void {
                $table->unique('student_id', 'transport_allocations_student_id_unique');
            });
        }
    }
};
