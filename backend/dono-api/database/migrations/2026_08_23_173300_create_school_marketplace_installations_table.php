<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('school_marketplace_installations')) {
            return;
        }

        Schema::create('school_marketplace_installations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('marketplace_app_id')->constrained('marketplace_apps')->cascadeOnDelete();
            $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('active');
            $table->text('configuration')->nullable();
            $table->timestamp('installed_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'marketplace_app_id'], 'school_marketplace_app_unique');
            $table->index(['school_id', 'status'], 'school_marketplace_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_marketplace_installations');
    }
};
