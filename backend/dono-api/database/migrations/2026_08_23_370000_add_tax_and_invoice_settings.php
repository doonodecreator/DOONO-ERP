<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_settings', function (Blueprint $table): void {
            if (! Schema::hasColumn('school_settings', 'invoice_prefix')) {
                $table->string('invoice_prefix', 12)->default('INV');
            }
            if (! Schema::hasColumn('school_settings', 'next_invoice_number')) {
                $table->unsignedInteger('next_invoice_number')->default(1);
            }
            if (! Schema::hasColumn('school_settings', 'tax_enabled')) {
                $table->boolean('tax_enabled')->default(false);
            }
            if (! Schema::hasColumn('school_settings', 'tax_name')) {
                $table->string('tax_name', 100)->nullable();
            }
            if (! Schema::hasColumn('school_settings', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('school_settings', 'tax_identifier')) {
                $table->string('tax_identifier', 100)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table): void {
            $columns = array_values(array_filter([
                Schema::hasColumn('school_settings', 'invoice_prefix') ? 'invoice_prefix' : null,
                Schema::hasColumn('school_settings', 'next_invoice_number') ? 'next_invoice_number' : null,
                Schema::hasColumn('school_settings', 'tax_enabled') ? 'tax_enabled' : null,
                Schema::hasColumn('school_settings', 'tax_name') ? 'tax_name' : null,
                Schema::hasColumn('school_settings', 'tax_rate') ? 'tax_rate' : null,
                Schema::hasColumn('school_settings', 'tax_identifier') ? 'tax_identifier' : null,
            ]));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
