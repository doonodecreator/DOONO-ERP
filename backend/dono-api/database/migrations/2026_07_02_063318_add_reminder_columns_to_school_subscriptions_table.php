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
        Schema::table('school_subscriptions', function (Blueprint $table) {

            $table->timestamp('first_reminder_sent_at')
                ->nullable()
                ->after('next_billing_date');

            $table->timestamp('second_reminder_sent_at')
                ->nullable()
                ->after('first_reminder_sent_at');

            $table->timestamp('final_reminder_sent_at')
                ->nullable()
                ->after('second_reminder_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {

            $table->dropColumn([
                'first_reminder_sent_at',
                'second_reminder_sent_at',
                'final_reminder_sent_at',
            ]);
        });
    }
};
