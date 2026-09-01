<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_exchange_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->unique()->constrained('schools')->cascadeOnDelete();
            $table->boolean('enabled')->default(false);
            $table->boolean('international_enabled')->default(false);
            $table->text('safeguarding_note')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('exchange_projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('title', 180);
            $table->text('description');
            $table->string('subject', 120)->nullable();
            $table->string('age_band', 80)->nullable();
            $table->string('country_focus', 120)->nullable();
            $table->string('status', 30)->default('draft');
            $table->boolean('allow_international')->default(false);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'status']);
        });

        Schema::create('exchange_project_schools', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exchange_project_id')->constrained('exchange_projects')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('status', 30)->default('invited');
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('responded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            $table->unique(['exchange_project_id', 'school_id']);
            $table->index(['school_id', 'status']);
        });

        Schema::create('exchange_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('exchange_project_id')->constrained('exchange_projects')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('display_alias', 80);
            $table->string('status', 30)->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['exchange_project_id', 'student_id']);
            $table->index(['school_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_participants');
        Schema::dropIfExists('exchange_project_schools');
        Schema::dropIfExists('exchange_projects');
        Schema::dropIfExists('school_exchange_settings');
    }
};
