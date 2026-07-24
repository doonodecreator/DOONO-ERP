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
        Schema::create('result_submissions', function (Blueprint $table) {

            $table->id();

            $table->foreignId('school_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('class_id')
                ->constrained('classes')
                ->cascadeOnDelete();

            $table->foreignId('subject_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('academic_session_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('term_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Workflow
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'draft',
                'submitted',
                'approved',
                'published',
                'rejected'
            ])->default('draft');

            /*
            |--------------------------------------------------------------------------
            | Users
            |--------------------------------------------------------------------------
            */

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            $table->timestamp('submitted_at')->nullable();

            $table->timestamp('approved_at')->nullable();

            $table->timestamp('published_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Comments
            |--------------------------------------------------------------------------
            */

            $table->text('approval_note')->nullable();

            $table->timestamps();

            $table->unique([
                'school_id',
                'class_id',
                'subject_id',
                'academic_session_id',
                'term_id'
            ], 'unique_result_submission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('result_submissions');
    }
};
