<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('oauth_clients')) {
            return;
        }

        Schema::table('oauth_clients', function (Blueprint $table): void {
            if (! Schema::hasColumn('oauth_clients', 'school_id')) {
                $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->nullOnDelete();
            }
            if (! Schema::hasColumn('oauth_clients', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('school_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('oauth_clients', 'scopes')) {
                $table->json('scopes')->nullable()->after('grant_types');
            }
        });

        Schema::table('oauth_clients', function (Blueprint $table): void {
            $table->index(['school_id', 'revoked'], 'oauth_clients_school_revoked_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('oauth_clients')) {
            return;
        }

        Schema::table('oauth_clients', function (Blueprint $table): void {
            if (Schema::hasColumn('oauth_clients', 'school_id')) {
                $table->dropForeign(['school_id']);
                $table->dropIndex('oauth_clients_school_revoked_idx');
                $table->dropColumn('school_id');
            }
            if (Schema::hasColumn('oauth_clients', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
            if (Schema::hasColumn('oauth_clients', 'scopes')) {
                $table->dropColumn('scopes');
            }
        });
    }
};
