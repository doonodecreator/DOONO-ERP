<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_setup_checklist_states', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('step_key', 80);
            $table->boolean('acknowledged')->default(false);
            $table->foreignId('last_viewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'step_key'], 'sscs_school_step_uq');
            $table->index(['school_id', 'acknowledged'], 'sscs_school_ack_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_setup_checklist_states');
    }
};
