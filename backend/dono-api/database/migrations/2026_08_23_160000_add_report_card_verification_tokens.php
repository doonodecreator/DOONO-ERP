<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            if (! Schema::hasColumn('report_cards', 'verification_token')) {
                $table->string('verification_token', 64)->nullable()->unique()->after('is_published');
            }
        });

        DB::table('report_cards')
            ->where('is_published', true)
            ->whereNull('verification_token')
            ->select('id')
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('report_cards')->where('id', $row->id)->update([
                        'verification_token' => Str::random(48),
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('report_cards', function (Blueprint $table) {
            if (Schema::hasColumn('report_cards', 'verification_token')) {
                $table->dropUnique(['verification_token']);
                $table->dropColumn('verification_token');
            }
        });
    }
};
