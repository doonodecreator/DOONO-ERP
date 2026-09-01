<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('result_submissions')) {
            return;
        }

        Schema::table('result_submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('result_submissions', 'reopen_reason')) {
                $table->text('reopen_reason')->nullable()->after('published_at');
            }
            if (! Schema::hasColumn('result_submissions', 'reopened_by')) {
                $table->foreignId('reopened_by')->nullable()->after('reopen_reason')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('result_submissions', 'reopened_at')) {
                $table->timestamp('reopened_at')->nullable()->after('reopened_by');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('result_submissions')) {
            return;
        }

        Schema::table('result_submissions', function (Blueprint $table) {
            if (Schema::hasColumn('result_submissions', 'reopened_by')) {
                $table->dropForeign(['reopened_by']);
            }
            $columns = collect(['reopen_reason', 'reopened_by', 'reopened_at'])
                ->filter(fn (string $column) => Schema::hasColumn('result_submissions', $column))
                ->values()
                ->all();
            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};

