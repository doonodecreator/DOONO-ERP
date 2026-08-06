<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('reception_appointments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('school_id')->constrained()->cascadeOnDelete();
        $table->string('visitor_name');
        $table->string('phone_number');
        $table->string('host_staff');
        $table->dateTime('appointment_date');
        $table->enum('status', ['Scheduled', 'Completed', 'Cancelled'])->default('Scheduled');
        $table->text('notes')->nullable();
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reception_appointments');
    }
};
