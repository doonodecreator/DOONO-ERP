<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cbt_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('cbt_questions', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('examination_id')->constrained('subjects')->nullOnDelete();
            }
            if (! Schema::hasColumn('cbt_questions', 'section')) {
                $table->string('section', 120)->nullable()->after('subject_id');
            }
            if (! Schema::hasColumn('cbt_questions', 'topic')) {
                $table->string('topic', 180)->nullable()->after('section');
            }
            if (! Schema::hasColumn('cbt_questions', 'difficulty')) {
                $table->string('difficulty', 20)->default('medium')->after('topic');
            }
            if (! Schema::hasColumn('cbt_questions', 'question_order')) {
                $table->unsignedInteger('question_order')->default(1)->after('marks');
            }
            if (! Schema::hasColumn('cbt_questions', 'batch_key')) {
                $table->string('batch_key', 64)->nullable()->after('question_order');
            }
        });

        $indexExists = collect(Schema::getIndexes('cbt_questions'))->contains(fn (array $index) => ($index['name'] ?? null) === 'cbt_questions_bank_filter_index');
        if (! $indexExists) {
            Schema::table('cbt_questions', function (Blueprint $table) {
                $table->index(['school_id', 'subject_id', 'section', 'difficulty'], 'cbt_questions_bank_filter_index');
            });
        }
    }

    public function down(): void
    {
        if (collect(Schema::getIndexes('cbt_questions'))->contains(fn (array $index) => ($index['name'] ?? null) === 'cbt_questions_bank_filter_index')) {
            Schema::table('cbt_questions', function (Blueprint $table) {
                $table->dropIndex('cbt_questions_bank_filter_index');
            });
        }

        Schema::table('cbt_questions', function (Blueprint $table) {
            foreach (['batch_key', 'question_order', 'difficulty', 'topic', 'section', 'subject_id'] as $column) {
                if (Schema::hasColumn('cbt_questions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
