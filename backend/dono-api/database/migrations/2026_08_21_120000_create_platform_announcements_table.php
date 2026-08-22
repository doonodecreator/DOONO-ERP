<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('subject');
            $table->longText('body');
            $table->string('action_url', 2048)->nullable();
            $table->string('action_label')->nullable();
            $table->string('audience', 30)->default('verified_users');
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('recipient_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_announcements');
    }
};
