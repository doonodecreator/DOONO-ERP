<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('asset_number');
            $table->string('name');
            $table->enum('category', [
                'IT Equipment',
                'Furniture',
                'Classroom Equipment',
                'Laboratory',
                'Sports',
                'Security',
                'Office',
                'Other',
            ]);
            $table->unsignedInteger('quantity')->default(1);
            $table->string('unit_of_measure', 50)->default('Item');
            $table->string('location');
            $table->foreignId('custodian_staff_id')->nullable()
                ->constrained('staff')->nullOnDelete();
            $table->date('acquisition_date')->nullable();
            $table->decimal('acquisition_cost', 15, 2)->nullable();
            $table->date('warranty_expires_at')->nullable();
            $table->enum('condition', ['New', 'Good', 'Fair', 'Poor'])->default('Good');
            $table->enum('status', ['Active', 'In Repair', 'Lost', 'Disposed'])->default('Active');
            $table->text('notes')->nullable();
            $table->foreignId('registered_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['school_id', 'asset_number'], 'assets_school_number_unique');
            $table->index(['school_id', 'status', 'category'], 'assets_school_status_category_index');
            $table->index(['custodian_staff_id', 'status'], 'assets_custodian_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
