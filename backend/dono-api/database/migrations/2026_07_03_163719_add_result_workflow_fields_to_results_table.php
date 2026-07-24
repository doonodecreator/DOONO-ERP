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

            /*
            |--------------------------------------------------------------------------
            | Result Workflow
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'status',
                [
                    'draft',
                    'submitted',
                    'approved',
                    'published',
                    'locked'
                ]
            )->default('draft')
             ->after('is_published');

            $table->foreignId('approved_by')
                ->nullable()
                ->after('status')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')
                ->nullable()
                ->after('approved_by');

            $table->timestamp('published_at')
                ->nullable()
                ->after('approved_at');

            $table->timestamp('locked_at')
                ->nullable()
                ->after('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {

            $table->dropForeign(['approved_by']);

            $table->dropColumn([
                'status',
                'approved_by',
                'approved_at',
                'published_at',
                'locked_at',
            ]);
        });
    }
};
