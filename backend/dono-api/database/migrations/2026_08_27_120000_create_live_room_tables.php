<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_rooms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('exchange_project_id')->nullable()->constrained('exchange_projects')->nullOnDelete();
            $table->foreignId('host_user_id')->constrained('users')->restrictOnDelete();
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->string('audience_type', 40)->default('school');
            $table->string('status', 30)->default('draft');
            $table->string('provider', 60)->nullable();
            $table->string('provider_room_id', 180)->nullable();
            $table->unsignedSmallInteger('max_participants')->default(50);
            $table->boolean('recording_enabled')->default(false);
            $table->boolean('recording_consent_required')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'status']);
            $table->index(['exchange_project_id', 'status']);
        });

        Schema::create('live_room_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('live_room_id')->constrained('live_rooms')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('display_alias', 100);
            $table->string('status', 30)->default('waiting');
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('admitted_at')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['live_room_id', 'user_id']);
            $table->index(['school_id', 'status']);
        });

        Schema::create('live_room_reports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('live_room_id')->constrained('live_rooms')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('reporter_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('participant_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 60);
            $table->text('details')->nullable();
            $table->string('status', 30)->default('open');
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_room_reports');
        Schema::dropIfExists('live_room_participants');
        Schema::dropIfExists('live_rooms');
    }
};
