<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_insight_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('alert_key', 120);
            $table->string('type', 40);
            $table->string('severity', 20)->default('info');
            $table->string('title');
            $table->text('message');
            $table->json('evidence')->nullable();
            $table->string('status', 20)->default('open');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'alert_key'], 'school_insight_alert_identity');
            $table->index(['school_id', 'status', 'severity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_insight_alerts');
    }
};
