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
        Schema::table('academic_configurations', function (Blueprint $table) {

            if (!Schema::hasColumn('academic_configurations', 'require_class_teacher_review')) {
                $table->boolean('require_class_teacher_review')->default(false);
            }

            if (!Schema::hasColumn('academic_configurations', 'require_vice_principal_approval')) {
                $table->boolean('require_vice_principal_approval')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'require_principal_approval')) {
                $table->boolean('require_principal_approval')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'auto_publish_after_approval')) {
                $table->boolean('auto_publish_after_approval')->default(false);
            }

            if (!Schema::hasColumn('academic_configurations', 'lock_after_publishing')) {
                $table->boolean('lock_after_publishing')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_student_passport')) {
                $table->boolean('show_student_passport')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_class_position')) {
                $table->boolean('show_class_position')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_class_average')) {
                $table->boolean('show_class_average')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_highest_score')) {
                $table->boolean('show_highest_score')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_lowest_score')) {
                $table->boolean('show_lowest_score')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_attendance')) {
                $table->boolean('show_attendance')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_behaviour')) {
                $table->boolean('show_behaviour')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_skills')) {
                $table->boolean('show_skills')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_teacher_comment')) {
                $table->boolean('show_teacher_comment')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_principal_comment')) {
                $table->boolean('show_principal_comment')->default(true);
            }

            if (!Schema::hasColumn('academic_configurations', 'show_qr_verification')) {
                $table->boolean('show_qr_verification')->default(true);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_configurations', function (Blueprint $table) {

            $columns = [
                'require_class_teacher_review',
                'require_vice_principal_approval',
                'require_principal_approval',
                'auto_publish_after_approval',
                'lock_after_publishing',
                'show_student_passport',
                'show_class_position',
                'show_class_average',
                'show_highest_score',
                'show_lowest_score',
                'show_attendance',
                'show_behaviour',
                'show_skills',
                'show_teacher_comment',
                'show_principal_comment',
                'show_qr_verification',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('academic_configurations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
