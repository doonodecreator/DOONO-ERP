<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {

            $table->id();

            $table->string('name');

            $table->string('short_name')->nullable();

            $table->string('registration_number')->nullable();

            $table->string('email')->nullable();

            $table->string('phone')->nullable();

            $table->string('alternative_phone')->nullable();

            $table->string('website')->nullable();

            $table->string('logo')->nullable();

            $table->string('country')->default('Nigeria');

            $table->string('state');

            $table->string('lga');

            $table->text('address')->nullable();

            $table->enum('status', [
                'active',
                'inactive',
                'suspended'
            ])->default('active');

            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
