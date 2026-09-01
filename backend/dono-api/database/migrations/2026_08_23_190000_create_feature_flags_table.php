<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100);
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('scope_type', 20)->default('platform');
            $table->unsignedBigInteger('scope_id')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->unsignedTinyInteger('rollout_percentage')->default(100);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['key', 'scope_type', 'scope_id'], 'feature_flag_scope_identity');
            $table->index(['scope_type', 'scope_id', 'is_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
    }
};
