<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('school_api_keys')) {
            return;
        }

        Schema::create('school_api_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('name', 120);
            $table->string('key_prefix', 20);
            $table->string('key_hash', 64)->unique('school_api_key_hash_uq');
            $table->json('scopes');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['school_id', 'revoked_at'], 'school_api_key_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_api_keys');
    }
};
