<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyIncident extends Model
{
    protected $fillable = [
        'school_id',
        'incident_number',
        'subject_type',
        'student_id',
        'staff_id',
        'visitor_id',
        'other_subject_name',
        'subject_label',
        'clinic_visit_id',
        'reported_by',
        'incident_at',
        'category',
        'severity',
        'location',
        'description',
        'immediate_action',
        'requires_medical_attention',
        'guardian_contacted',
        'guardian_contacted_at',
        'emergency_services_contacted',
        'emergency_services_contacted_at',
        'status',
        'reviewed_by',
        'reviewed_at',
        'resolution_notes',
    ];

    protected $casts = [
        'incident_at' => 'datetime',
        'requires_medical_attention' => 'boolean',
        'guardian_contacted' => 'boolean',
        'guardian_contacted_at' => 'datetime',
        'emergency_services_contacted' => 'boolean',
        'emergency_services_contacted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    public function clinicVisit(): BelongsTo
    {
        return $this->belongsTo(ClinicVisit::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
