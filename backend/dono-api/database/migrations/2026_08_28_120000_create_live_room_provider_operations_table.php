<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('live_room_provider_operations')) {
            return;
        }

        Schema::create('live_room_provider_operations', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('live_room_id');
            $table->unsignedBigInteger('school_id');
            $table->string('operation', 60);
            $table->string('status', 20);
            $table->unsignedSmallInteger('provider_status')->nullable();
            $table->string('error_message', 500)->nullable();
            $table->timestamp('attempted_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->foreign('live_room_id', 'pro_ops_room_fk')->references('id')->on('live_rooms')->cascadeOnDelete();
            $table->index(['school_id', 'status', 'created_at'], 'pro_ops_school_status_idx');
            $table->index(['live_room_id', 'operation', 'created_at'], 'pro_ops_room_op_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_room_provider_operations');
    }
};
