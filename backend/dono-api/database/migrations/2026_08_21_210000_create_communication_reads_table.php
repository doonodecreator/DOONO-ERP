<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('communication_id')->constrained('communications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->timestamps();

            $table->unique(['communication_id', 'user_id']);
            $table->index(['school_id', 'user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_reads');
    }
};
