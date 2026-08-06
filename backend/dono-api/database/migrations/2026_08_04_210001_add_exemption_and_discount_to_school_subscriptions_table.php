<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {

            if (!Schema::hasColumn('school_subscriptions', 'is_exempt')) {
                $table->boolean('is_exempt')
                    ->default(false)
                    ->after('is_current');
            }

            if (!Schema::hasColumn('school_subscriptions', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)
                    ->default(0)
                    ->after('is_exempt');
            }

            if (!Schema::hasColumn('school_subscriptions', 'discount_reason')) {
                $table->text('discount_reason')
                    ->nullable()
                    ->after('discount_percentage');
            }

            if (!Schema::hasColumn('school_subscriptions', 'exempted_by')) {
                $table->foreignId('exempted_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('discount_reason');
            }

            if (!Schema::hasColumn('school_subscriptions', 'exempted_at')) {
                $table->timestamp('exempted_at')
                    ->nullable()
                    ->after('exempted_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {

            if (Schema::hasColumn('school_subscriptions', 'exempted_at')) {
                $table->dropColumn('exempted_at');
            }

            if (Schema::hasColumn('school_subscriptions', 'exempted_by')) {
                $table->dropConstrainedForeignId('exempted_by');
            }

            if (Schema::hasColumn('school_subscriptions', 'discount_reason')) {
                $table->dropColumn('discount_reason');
            }

            if (Schema::hasColumn('school_subscriptions', 'discount_percentage')) {
                $table->dropColumn('discount_percentage');
            }

            if (Schema::hasColumn('school_subscriptions', 'is_exempt')) {
                $table->dropColumn('is_exempt');
            }
        });
    }
};
