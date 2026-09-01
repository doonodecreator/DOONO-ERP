<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            if (! Schema::hasColumn('timetables', 'workflow_status')) {
                $table->string('workflow_status', 20)->default('draft');
            }
            if (! Schema::hasColumn('timetables', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable();
            }
            if (! Schema::hasColumn('timetables', 'approved_at')) {
                $table->timestamp('approved_at')->nullable();
            }
            if (! Schema::hasColumn('timetables', 'published_at')) {
                $table->timestamp('published_at')->nullable();
            }
            if (! Schema::hasColumn('timetables', 'submitted_by')) {
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('timetables', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('timetables', 'published_by')) {
                $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });

        DB::table('timetables')
            ->where('is_active', true)
            ->where('workflow_status', 'draft')
            ->update([
                'workflow_status' => 'published',
                'published_at' => DB::raw('COALESCE(published_at, updated_at)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            foreach (['published_by', 'approved_by', 'submitted_by'] as $column) {
                if (Schema::hasColumn('timetables', $column)) {
                    $table->dropForeign([$column]);
                    $table->dropColumn($column);
                }
            }
            foreach (['published_at', 'approved_at', 'submitted_at', 'workflow_status'] as $column) {
                if (Schema::hasColumn('timetables', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
