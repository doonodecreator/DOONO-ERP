<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ai_conversations')) {
            Schema::create('ai_conversations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->string('title', 160)->nullable();
                $table->string('status', 30)->default('active');
                $table->timestamps();
                $table->index(['school_id', 'user_id', 'status'], 'ai_conversations_school_user_status_idx');
            });
        }

        if (! Schema::hasTable('ai_messages')) {
            Schema::create('ai_messages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('ai_conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('role', 20);
                $table->longText('content');
                $table->string('provider', 80)->nullable();
                $table->string('model', 120)->nullable();
                $table->unsignedInteger('input_tokens')->nullable();
                $table->unsignedInteger('output_tokens')->nullable();
                $table->timestamps();
                $table->index(['ai_conversation_id', 'created_at'], 'ai_messages_conversation_created_idx');
            });
        }

        if (! Schema::hasTable('student_community_consents')) {
            Schema::create('student_community_consents', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained()->cascadeOnDelete();
                $table->foreignId('parent_id')->nullable()->constrained('parents')->nullOnDelete();
                $table->string('status', 30)->default('pending');
                $table->boolean('video_allowed')->default(false);
                $table->boolean('global_exchange_allowed')->default(false);
                $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('decided_at')->nullable();
                $table->timestamps();
                $table->unique(['school_id', 'student_id'], 'student_community_consents_school_student_uq');
                $table->index(['school_id', 'parent_id'], 'student_community_consents_school_parent_idx');
            });
        }

        if (! Schema::hasTable('community_posts')) {
            Schema::create('community_posts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('author_student_id')->constrained('students')->cascadeOnDelete();
                $table->text('body');
                $table->string('scope', 30)->default('school');
                $table->string('status', 30)->default('pending');
                $table->string('media_path')->nullable();
                $table->string('media_mime', 120)->nullable();
                $table->unsignedBigInteger('media_size')->nullable();
                $table->text('moderation_notes')->nullable();
                $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('moderated_at')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
                $table->index(['school_id', 'status', 'created_at'], 'community_posts_school_status_created_idx');
                $table->index(['school_id', 'author_student_id', 'status'], 'community_posts_school_author_status_idx');
            });
        }

        if (! Schema::hasTable('community_comments')) {
            Schema::create('community_comments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('community_post_id')->constrained('community_posts')->cascadeOnDelete();
                $table->foreignId('author_student_id')->constrained('students')->cascadeOnDelete();
                $table->text('body');
                $table->string('status', 30)->default('pending');
                $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('moderated_at')->nullable();
                $table->timestamps();
                $table->index(['community_post_id', 'status', 'created_at'], 'community_comments_post_status_created_idx');
            });
        }

        if (! Schema::hasTable('community_reports')) {
            Schema::create('community_reports', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('reporter_student_id')->constrained('students')->cascadeOnDelete();
                $table->string('target_type', 30);
                $table->unsignedBigInteger('target_id');
                $table->string('reason', 80);
                $table->text('details')->nullable();
                $table->string('status', 30)->default('pending');
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('resolution')->nullable();
                $table->timestamps();
                $table->index(['school_id', 'status', 'created_at'], 'community_reports_school_status_created_idx');
                $table->index(['target_type', 'target_id'], 'community_reports_target_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_reports');
        Schema::dropIfExists('community_comments');
        Schema::dropIfExists('community_posts');
        Schema::dropIfExists('student_community_consents');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
    }
};
