<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('communication_deliveries')) {
            return;
        }

        Schema::create('communication_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('communication_id')->constrained('communications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('push_token_id')->nullable()->constrained('user_push_tokens')->nullOnDelete();
            $table->string('channel', 20);
            $table->string('provider', 40);
            $table->string('destination', 255)->nullable();
            $table->string('provider_message_id', 150)->nullable();
            $table->string('status', 30)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('attempted_at')->nullable();
            $table->timestamp('provider_accepted_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_code', 100)->nullable();
            $table->text('failure_message')->nullable();
            $table->json('provider_metadata')->nullable();
            $table->timestamps();

            $table->unique(['communication_id', 'user_id', 'channel', 'push_token_id'], 'communication_delivery_unique');
            $table->unique(['provider', 'provider_message_id'], 'communication_provider_message_unique');
            $table->index(['school_id', 'channel', 'status'], 'communication_delivery_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_deliveries');
    }
};
