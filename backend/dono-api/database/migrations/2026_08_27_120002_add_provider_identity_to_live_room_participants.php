<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('live_room_participants') || Schema::hasColumn('live_room_participants', 'provider_identity')) {
            return;
        }

        Schema::table('live_room_participants', function (Blueprint $table): void {
            $table->string('provider_identity', 120)->nullable()->after('display_alias');
            $table->index('provider_identity');
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('live_room_participants') && Schema::hasColumn('live_room_participants', 'provider_identity')) {
            Schema::table('live_room_participants', function (Blueprint $table): void {
                $table->dropIndex(['provider_identity']);
                $table->dropColumn('provider_identity');
            });
        }
    }
};
