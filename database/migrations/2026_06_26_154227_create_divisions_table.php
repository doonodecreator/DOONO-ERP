<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('divisions', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('code',20)->nullable();

            $table->integer('display_order')->default(1);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['school_id','name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('divisions');
    }
};
