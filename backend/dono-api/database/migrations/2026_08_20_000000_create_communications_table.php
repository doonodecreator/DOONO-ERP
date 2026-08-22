<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->default('notice');
            $table->string('audience')->default('all');
            $table->string('subject')->nullable();
            $table->text('body');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index(['school_id', 'type', 'is_published']);
            $table->index(['recipient_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
