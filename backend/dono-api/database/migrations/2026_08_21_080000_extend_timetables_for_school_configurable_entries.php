<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            if (! Schema::hasColumn('timetables', 'entry_type')) {
                $table->string('entry_type', 30)->default('lesson')->after('id');
            }
            if (! Schema::hasColumn('timetables', 'schedule_mode')) {
                $table->string('schedule_mode', 20)->default('weekly')->after('entry_type');
            }
            if (! Schema::hasColumn('timetables', 'target_type')) {
                $table->string('target_type', 20)->default('class')->after('schedule_mode');
            }
            if (! Schema::hasColumn('timetables', 'title')) {
                $table->string('title')->nullable()->after('subject_id');
            }
            if (! Schema::hasColumn('timetables', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (! Schema::hasColumn('timetables', 'event_date')) {
                $table->date('event_date')->nullable()->after('end_time');
            }
            if (! Schema::hasColumn('timetables', 'effective_from')) {
                $table->date('effective_from')->nullable()->after('event_date');
            }
            if (! Schema::hasColumn('timetables', 'effective_until')) {
                $table->date('effective_until')->nullable()->after('effective_from');
            }
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->unsignedBigInteger('division_id')->nullable()->change();
            $table->unsignedBigInteger('class_id')->nullable()->change();
            $table->unsignedBigInteger('subject_id')->nullable()->change();
            $table->enum('day_of_week', [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
            ])->nullable()->change();
            $table->time('start_time')->nullable()->change();
            $table->time('end_time')->nullable()->change();
        });

        $indexNames = collect(Schema::getIndexes('timetables'))->pluck('name')->all();
        Schema::table('timetables', function (Blueprint $table) use ($indexNames) {
            // The old unique index begins with class_id and is also the index
            // MySQL uses for the classes foreign key. Preserve that support
            // index before dropping the old unique constraint.
            if (in_array('class_timetable_unique', $indexNames, true) && ! in_array('timetables_class_id_fk_index', $indexNames, true)) {
                $table->index('class_id', 'timetables_class_id_fk_index');
            }
            if (in_array('class_timetable_unique', $indexNames, true)) {
                $table->dropUnique('class_timetable_unique');
            }
            if (! in_array('school_term_timetable_unique', $indexNames, true)) {
                $table->unique(
                    ['school_id', 'academic_session_id', 'term_id', 'class_id', 'stream_id', 'day_of_week', 'start_time'],
                    'school_term_timetable_unique',
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('timetables', function (Blueprint $table) {
            $table->dropUnique('school_term_timetable_unique');
            $table->unique(
                ['class_id', 'stream_id', 'day_of_week', 'start_time'],
                'class_timetable_unique',
            );

            foreach (['effective_until', 'effective_from', 'event_date', 'description', 'title', 'target_type', 'schedule_mode', 'entry_type'] as $column) {
                if (Schema::hasColumn('timetables', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
