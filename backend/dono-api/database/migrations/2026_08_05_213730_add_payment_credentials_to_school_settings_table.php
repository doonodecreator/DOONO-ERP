<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'bank_name')) {
                $table->string('bank_name')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'account_number')) {
                $table->string('account_number')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'account_name')) {
                $table->string('account_name')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'paystack_public_key')) {
                $table->string('paystack_public_key')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'paystack_secret_key')) {
                $table->string('paystack_secret_key')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'paystack_subaccount_code')) {
                $table->string('paystack_subaccount_code')->nullable();
            }
            if (!Schema::hasColumn('school_settings', 'motto')) {
                $table->string('motto')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn([
                'bank_name',
                'account_number',
                'account_name',
                'paystack_public_key',
                'paystack_secret_key',
                'paystack_subaccount_code',
                'motto'
            ]);
        });
    }
};
