<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('live_room_recordings')) {
            return;
        }

        Schema::create('live_room_recordings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('live_room_id');
            $table->unsignedBigInteger('school_id');
            $table->string('provider', 60);
            $table->string('provider_egress_id', 180)->nullable();
            $table->string('status', 30)->default('requested');
            $table->string('file_path', 500)->nullable();
            $table->string('file_mime', 100)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->unsignedBigInteger('duration_seconds')->nullable();
            $table->text('failure_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->foreign('live_room_id', 'lrr_room_fk')->references('id')->on('live_rooms')->cascadeOnDelete();
            $table->index(['school_id', 'status', 'created_at'], 'lrr_school_status_idx');
            $table->index(['provider_egress_id', 'provider'], 'lrr_provider_egress_idx');
            $table->index(['expires_at', 'status'], 'lrr_expiry_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_room_recordings');
    }
};
