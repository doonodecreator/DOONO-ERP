<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('event_type', 50)->default('Other');
            $table->text('description')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->string('venue')->nullable();
            $table->foreignId('organizer_staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('audience', 100)->nullable();
            $table->string('status', 30)->default('Planned');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['school_id', 'start_at']);
            $table->index(['school_id', 'status']);
            $table->index(['school_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_events');
    }
};
