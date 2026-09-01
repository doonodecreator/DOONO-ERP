<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('live_room_participants') || Schema::hasColumn('live_room_participants', 'recording_consent')) {
            return;
        }

        Schema::table('live_room_participants', function (Blueprint $table): void {
            $table->boolean('recording_consent')->default(false)->after('status');
            $table->timestamp('recording_consent_at')->nullable()->after('recording_consent');
            $table->index(['live_room_id', 'recording_consent'], 'lrp_recording_consent_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('live_room_participants') || ! Schema::hasColumn('live_room_participants', 'recording_consent')) {
            return;
        }

        Schema::table('live_room_participants', function (Blueprint $table): void {
            $table->dropIndex('lrp_recording_consent_idx');
            $table->dropColumn(['recording_consent', 'recording_consent_at']);
        });
    }
};
