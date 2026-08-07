<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Platform Owner Action?
            |--------------------------------------------------------------------------
            |
            | true  = Software Owner
            | false = School Users
            |
            */

            $table->boolean('is_platform_action')
                ->default(false)
                ->index();

            $table->string('module')->index();

            $table->string('action');

            $table->text('description')->nullable();

            $table->nullableMorphs('subject');

            $table->json('properties')->nullable();

            $table->string('ip_address',45)->nullable();

            $table->text('user_agent')->nullable();

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
