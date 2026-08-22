<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('role_invitations', 'form_class_id')) {
            Schema::table('role_invitations', function (Blueprint $table) {
                $table->foreignId('form_class_id')
                    ->nullable()
                    ->after('role_id')
                    ->constrained('classes')
                    ->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('role_invitations', 'form_stream_id')) {
            Schema::table('role_invitations', function (Blueprint $table) {
                $table->foreignId('form_stream_id')
                    ->nullable()
                    ->after('form_class_id')
                    ->constrained('streams')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('role_invitations', 'form_stream_id')) {
            Schema::table('role_invitations', function (Blueprint $table) {
                $table->dropConstrainedForeignId('form_stream_id');
            });
        }

        if (Schema::hasColumn('role_invitations', 'form_class_id')) {
            Schema::table('role_invitations', function (Blueprint $table) {
                $table->dropConstrainedForeignId('form_class_id');
            });
        }
    }
};
