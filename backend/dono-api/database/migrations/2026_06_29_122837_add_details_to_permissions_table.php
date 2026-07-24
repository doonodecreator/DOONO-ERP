<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Already handled in the create_permissions_table migration.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nothing to reverse.
    }
};
