<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discipline_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('case_number');
            $table->foreignId('reported_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->date('incident_date');
            $table->enum('category', [
                'Bullying',
                'Disrespect',
                'Violence',
                'Theft',
                'Harassment',
                'Academic Misconduct',
                'Property Damage',
                'Absenteeism',
                'Other',
            ]);
            $table->enum('severity', ['Minor', 'Major', 'Critical']);
            $table->text('description');
            $table->enum('status', [
                'Reported',
                'Under Review',
                'Resolved',
                'Dismissed',
            ])->default('Reported');
            $table->text('action_taken')->nullable();
            $table->boolean('parent_notified')->default(false);
            $table->dateTime('parent_notified_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['school_id', 'case_number'],
                'discipline_cases_school_number_unique'
            );
            $table->index(
                ['school_id', 'status', 'incident_date'],
                'discipline_cases_school_status_date_index'
            );
            $table->index(
                ['student_id', 'incident_date'],
                'discipline_cases_student_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discipline_cases');
    }
};
