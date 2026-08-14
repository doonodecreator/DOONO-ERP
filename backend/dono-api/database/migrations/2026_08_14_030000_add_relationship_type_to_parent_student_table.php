<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('parent_student', 'relationship_type')) {
            return;
        }

        Schema::table('parent_student', function (Blueprint $table) {
            $table->string('relationship_type', 50)
                ->nullable()
                ->after('student_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('parent_student', 'relationship_type')) {
            return;
        }

        Schema::table('parent_student', function (Blueprint $table) {
            $table->dropColumn('relationship_type');
        });
    }
};
