<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_room_provider_events', function (Blueprint $table): void {
            $table->id();
            $table->string('provider', 60);
            $table->string('event_id', 180);
            $table->string('event_name', 80);
            $table->string('provider_room_id', 180)->nullable();
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'event_id']);
            $table->index(['provider_room_id', 'event_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_room_provider_events');
    }
};
