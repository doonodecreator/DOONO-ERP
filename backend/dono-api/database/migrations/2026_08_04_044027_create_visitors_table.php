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
    Schema::create('visitors', function (Blueprint $table) {
        $table->id();
        $table->foreignId('school_id')->constrained()->cascadeOnDelete();
        $table->string('visitor_name');
        $table->string('phone_number');
        $table->string('to_see');
        $table->text('purpose');
        $table->timestamp('check_in_time')->nullable();
        $table->timestamp('check_out_time')->nullable();
        $table->enum('status', ['Checked In', 'Checked Out'])->default('Checked In');
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
