<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create activity_logs table if it doesn't exist
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->boolean('is_platform_action')->default(false);
                $table->string('module')->nullable();
                $table->string('action')->nullable();
                $table->text('description')->nullable();
                $table->string('subject_type')->nullable();
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->json('properties')->nullable();
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add subscription exemption and discount columns if missing
        if (Schema::hasTable('school_subscriptions')) {
            Schema::table('school_subscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('school_subscriptions', 'is_exempt')) {
                    $table->boolean('is_exempt')->default(false);
                }
                if (!Schema::hasColumn('school_subscriptions', 'exempted_by')) {
                    $table->unsignedBigInteger('exempted_by')->nullable();
                }
                if (!Schema::hasColumn('school_subscriptions', 'exempted_at')) {
                    $table->timestamp('exempted_at')->nullable();
                }
                if (!Schema::hasColumn('school_subscriptions', 'discount_percentage')) {
                    $table->decimal('discount_percentage', 5, 2)->default(0);
                }
                if (!Schema::hasColumn('school_subscriptions', 'discount_reason')) {
                    $table->text('discount_reason')->nullable();
                }
                if (!Schema::hasColumn('school_subscriptions', 'discount_ends_on')) {
                    $table->date('discount_ends_on')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Rollback steps if needed
    }
};
