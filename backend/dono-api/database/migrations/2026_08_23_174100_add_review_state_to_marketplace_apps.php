<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('marketplace_apps')) {
            return;
        }

        if (! Schema::hasColumn('marketplace_apps', 'review_status')) {
            Schema::table('marketplace_apps', function (Blueprint $table): void {
                $table->string('review_status', 30)->default('pending')->after('status');
            });
        }
        if (! Schema::hasColumn('marketplace_apps', 'reviewed_by')) {
            Schema::table('marketplace_apps', function (Blueprint $table): void {
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('created_by');
            });
        }
        if (! Schema::hasColumn('marketplace_apps', 'reviewed_at')) {
            Schema::table('marketplace_apps', function (Blueprint $table): void {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            });
        }
        if (! Schema::hasColumn('marketplace_apps', 'security_notes')) {
            Schema::table('marketplace_apps', function (Blueprint $table): void {
                $table->text('security_notes')->nullable()->after('reviewed_at');
            });
        }

        // Existing published entries were already approved by the Software Owner
        // under the previous contract; new and draft entries remain pending.
        DB::table('marketplace_apps')
            ->where('status', 'published')
            ->where('review_status', 'pending')
            ->update(['review_status' => 'approved']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('marketplace_apps')) {
            return;
        }
        if (Schema::hasColumn('marketplace_apps', 'security_notes')) {
            Schema::table('marketplace_apps', fn (Blueprint $table) => $table->dropColumn('security_notes'));
        }
        if (Schema::hasColumn('marketplace_apps', 'reviewed_at')) {
            Schema::table('marketplace_apps', fn (Blueprint $table) => $table->dropColumn('reviewed_at'));
        }
        if (Schema::hasColumn('marketplace_apps', 'reviewed_by')) {
            Schema::table('marketplace_apps', fn (Blueprint $table) => $table->dropConstrainedForeignId('reviewed_by'));
        }
        if (Schema::hasColumn('marketplace_apps', 'review_status')) {
            Schema::table('marketplace_apps', fn (Blueprint $table) => $table->dropColumn('review_status'));
        }
    }
};

