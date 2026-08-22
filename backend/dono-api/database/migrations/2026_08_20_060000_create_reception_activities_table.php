<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reception_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('contact_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('subject')->nullable();
            $table->text('message')->nullable();
            $table->string('status', 30)->default('open');
            $table->timestamp('logged_at')->useCurrent();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['school_id', 'type', 'logged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reception_activities');
    }
};
