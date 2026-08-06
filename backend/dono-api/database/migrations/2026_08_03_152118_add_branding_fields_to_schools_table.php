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
        Schema::table('schools', function (Blueprint $table) {

            $table->string('report_card_logo')->nullable()->after('logo');

            $table->string('principal_signature')->nullable();

            $table->string('school_stamp')->nullable();

            $table->string('primary_color')->default('#1E40AF');

            $table->string('secondary_color')->default('#FFFFFF');

            $table->string('accent_color')->default('#F59E0B');

            $table->string('report_card_theme')->default('classic');

            $table->string('report_card_layout')->default('standard');

            $table->text('custom_header')->nullable();

            $table->text('custom_footer')->nullable();

            $table->boolean('show_watermark')->default(true);

            $table->boolean('allow_branding')->default(false);

            $table->string('watermark_text')->default('Powered by DONO ERP');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {

            $table->dropColumn([
                'report_card_logo',
                'principal_signature',
                'school_stamp',
                'primary_color',
                'secondary_color',
                'accent_color',
                'report_card_theme',
                'report_card_layout',
                'custom_header',
                'custom_footer',
                'show_watermark',
                'allow_branding',
                'watermark_text',
            ]);
        });
    }
};
