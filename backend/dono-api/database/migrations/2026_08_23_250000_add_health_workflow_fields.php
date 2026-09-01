<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('clinic_visits')) {
            return;
        }

        Schema::table('clinic_visits', function (Blueprint $table) {
            if (! Schema::hasColumn('clinic_visits', 'referral_status')) {
                $table->string('referral_status', 30)->default('none')->after('nurse_notes');
            }
            if (! Schema::hasColumn('clinic_visits', 'referral_destination')) {
                $table->string('referral_destination', 255)->nullable()->after('referral_status');
            }
            if (! Schema::hasColumn('clinic_visits', 'follow_up_date')) {
                $table->date('follow_up_date')->nullable()->after('referral_destination');
            }
            if (! Schema::hasColumn('clinic_visits', 'emergency_flag')) {
                $table->boolean('emergency_flag')->default(false)->after('follow_up_date');
            }
            if (! Schema::hasColumn('clinic_visits', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('treated_by')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('clinic_visits')) {
            return;
        }

        Schema::table('clinic_visits', function (Blueprint $table) {
            if (Schema::hasColumn('clinic_visits', 'updated_by')) {
                $table->dropForeign(['updated_by']);
            }
            $columns = collect(['referral_status', 'referral_destination', 'follow_up_date', 'emergency_flag', 'updated_by'])
                ->filter(fn (string $column) => Schema::hasColumn('clinic_visits', $column))
                ->values()
                ->all();
            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};

