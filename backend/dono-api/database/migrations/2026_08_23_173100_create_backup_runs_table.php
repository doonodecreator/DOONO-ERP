<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('backup_runs')) {
            return;
        }

        Schema::create('backup_runs', function (Blueprint $table): void {
            $table->id();
            $table->string('status', 30)->default('running');
            $table->string('disk', 80);
            $table->string('path', 500)->nullable();
            $table->unsignedBigInteger('bytes')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->text('failure_message')->nullable();
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'started_at'], 'backup_runs_status_started_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_runs');
    }
};
