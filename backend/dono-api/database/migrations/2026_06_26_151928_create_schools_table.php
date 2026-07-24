<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {

            $table->id();

            $table->foreignId('organization_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('short_name')->nullable();

            $table->enum('school_type', [
                'Primary',
                'Secondary',
                'Combined'
            ]);

            $table->boolean('has_primary')->default(true);

            $table->boolean('has_secondary')->default(false);

            $table->string('school_code')->unique();

            $table->string('email')->nullable();

            $table->string('phone')->nullable();

            $table->string('website')->nullable();

            $table->text('address')->nullable();

            $table->string('logo')->nullable();

            $table->enum('status', [
                'active',
                'inactive'
            ])->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
