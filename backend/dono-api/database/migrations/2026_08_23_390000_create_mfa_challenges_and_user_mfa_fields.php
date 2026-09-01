<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'mfa_enabled')) {
                $table->boolean('mfa_enabled')->default(false)->after('email_verified_at');
            }
            if (! Schema::hasColumn('users', 'mfa_secret')) {
                $table->text('mfa_secret')->nullable()->after('mfa_enabled');
            }
            if (! Schema::hasColumn('users', 'mfa_recovery_codes')) {
                $table->text('mfa_recovery_codes')->nullable()->after('mfa_secret');
            }
            if (! Schema::hasColumn('users', 'mfa_confirmed_at')) {
                $table->timestamp('mfa_confirmed_at')->nullable()->after('mfa_recovery_codes');
            }
            if (! Schema::hasColumn('users', 'mfa_last_used_at')) {
                $table->timestamp('mfa_last_used_at')->nullable()->after('mfa_confirmed_at');
            }
        });

        if (! Schema::hasTable('mfa_challenges')) {
            Schema::create('mfa_challenges', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('token_hash', 64)->unique('mfa_token_hash_uq');
                $table->timestamp('expires_at');
                $table->unsignedTinyInteger('attempts')->default(0);
                $table->timestamp('used_at')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'expires_at'], 'mfa_user_expiry_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mfa_challenges');
        Schema::table('users', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('users', 'mfa_enabled') ? 'mfa_enabled' : null,
                Schema::hasColumn('users', 'mfa_secret') ? 'mfa_secret' : null,
                Schema::hasColumn('users', 'mfa_recovery_codes') ? 'mfa_recovery_codes' : null,
                Schema::hasColumn('users', 'mfa_confirmed_at') ? 'mfa_confirmed_at' : null,
                Schema::hasColumn('users', 'mfa_last_used_at') ? 'mfa_last_used_at' : null,
            ]));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
