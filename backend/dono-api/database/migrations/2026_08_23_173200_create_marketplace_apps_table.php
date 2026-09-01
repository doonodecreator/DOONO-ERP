<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('marketplace_apps')) {
            return;
        }

        Schema::create('marketplace_apps', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 160);
            $table->string('publisher', 160);
            $table->text('description');
            $table->string('homepage_url', 500)->nullable();
            $table->json('capabilities')->nullable();
            $table->string('status', 30)->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status', 'marketplace_apps_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_apps');
    }
};
