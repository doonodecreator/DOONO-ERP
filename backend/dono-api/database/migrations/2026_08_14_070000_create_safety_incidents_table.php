<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('safety_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('incident_number');
            $table->enum('subject_type', ['Student', 'Staff', 'Visitor', 'Other']);
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->foreignId('visitor_id')->nullable()->constrained('visitors')->nullOnDelete();
            $table->string('other_subject_name')->nullable();
            $table->string('subject_label');
            $table->foreignId('clinic_visit_id')->nullable()
                ->constrained('clinic_visits')->nullOnDelete();
            $table->foreignId('reported_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('incident_at');
            $table->enum('category', [
                'Injury',
                'Illness',
                'Fire or Evacuation',
                'Hazard',
                'Security',
                'Transport',
                'Facility',
                'Other',
            ]);
            $table->enum('severity', ['Low', 'Moderate', 'High', 'Critical']);
            $table->string('location');
            $table->text('description');
            $table->text('immediate_action')->nullable();
            $table->boolean('requires_medical_attention')->default(false);
            $table->boolean('guardian_contacted')->default(false);
            $table->dateTime('guardian_contacted_at')->nullable();
            $table->boolean('emergency_services_contacted')->default(false);
            $table->dateTime('emergency_services_contacted_at')->nullable();
            $table->enum('status', [
                'Reported',
                'Under Review',
                'Resolved',
                'Closed',
            ])->default('Reported');
            $table->foreignId('reviewed_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['school_id', 'incident_number'],
                'safety_incidents_school_number_unique'
            );
            $table->index(
                ['school_id', 'status', 'incident_at'],
                'safety_incidents_school_status_time_index'
            );
            $table->index(
                ['student_id', 'incident_at'],
                'safety_incidents_student_time_index'
            );
            $table->index(
                ['staff_id', 'incident_at'],
                'safety_incidents_staff_time_index'
            );
            $table->index(
                ['visitor_id', 'incident_at'],
                'safety_incidents_visitor_time_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safety_incidents');
    }
};
