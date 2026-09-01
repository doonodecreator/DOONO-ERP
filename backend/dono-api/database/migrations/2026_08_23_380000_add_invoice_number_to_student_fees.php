<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_fees', function (Blueprint $table): void {
            if (! Schema::hasColumn('student_fees', 'school_id')) {
                $table->foreignId('school_id')->nullable()->after('id')->constrained('schools')->nullOnDelete();
            }
            if (! Schema::hasColumn('student_fees', 'invoice_number')) {
                $table->string('invoice_number', 40)->nullable()->after('id');
                $table->unique(['school_id', 'invoice_number'], 'student_school_invoice_uq');
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_fees', function (Blueprint $table): void {
            if (Schema::hasColumn('student_fees', 'invoice_number')) {
                $table->dropUnique('student_school_invoice_uq');
                $table->dropColumn('invoice_number');
            }
            if (Schema::hasColumn('student_fees', 'school_id')) {
                $table->dropForeign(['school_id']);
                $table->dropColumn('school_id');
            }
        });
    }
};
