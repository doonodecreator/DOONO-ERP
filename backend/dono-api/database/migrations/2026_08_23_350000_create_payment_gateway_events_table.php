<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateway_events', function (Blueprint $table): void {
            $table->id();
            $table->string('gateway', 30);
            $table->string('event_id', 150);
            $table->string('event_type', 80);
            $table->string('transaction_reference')->nullable();
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'event_id'], 'pge_gateway_event_uq');
            $table->index(['event_type', 'created_at'], 'pge_type_created_idx');
            $table->index('transaction_reference', 'pge_reference_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_events');
    }
};
