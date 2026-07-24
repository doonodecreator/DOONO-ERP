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
        Schema::table('results', function (Blueprint $table) {

            $table->foreignId('result_submission_id')
                ->nullable()
                ->after('school_id')
                ->constrained('result_submissions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {

            $table->dropForeign(['result_submission_id']);

            $table->dropColumn('result_submission_id');
        });
    }
};
