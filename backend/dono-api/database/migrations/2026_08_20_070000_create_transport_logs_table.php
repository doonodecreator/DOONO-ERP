<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transport_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->string('type', 30);
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('quantity', 10, 2)->nullable();
            $table->integer('odometer')->nullable();
            $table->date('service_date');
            $table->text('description')->nullable();
            $table->string('status', 30)->default('open');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['school_id', 'type', 'service_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transport_logs');
    }
};
