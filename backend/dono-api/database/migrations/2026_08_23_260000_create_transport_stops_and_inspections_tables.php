<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transport_stops')) {
            Schema::create('transport_stops', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('transport_route_id')->constrained()->cascadeOnDelete();
                $table->string('stop_name', 255);
                $table->string('address', 500)->nullable();
                $table->time('pickup_time')->nullable();
                $table->time('dropoff_time')->nullable();
                $table->unsignedSmallInteger('sequence')->default(1);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->unique(['transport_route_id', 'sequence'], 'tstop_route_seq_uq');
                $table->index(['school_id', 'transport_route_id'], 'tstop_school_route_idx');
            });
        }

        if (! Schema::hasTable('vehicle_inspections')) {
            Schema::create('vehicle_inspections', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
                $table->foreignId('inspected_by')->constrained('users');
                $table->date('inspection_date');
                $table->string('status', 30)->default('passed');
                $table->unsignedInteger('odometer')->nullable();
                $table->text('notes')->nullable();
                $table->date('next_due_date')->nullable();
                $table->timestamps();
                $table->index(['school_id', 'vehicle_id', 'inspection_date'], 'vinspect_school_vehicle_date_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_inspections');
        Schema::dropIfExists('transport_stops');
    }
};

