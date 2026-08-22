<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = [
        'organization_id',
        'tenant_partition_id',
        'partition_key',
        'data_region',
        'owner_id',

        'name',
        'short_name',

        'school_code',
        'school_type',

        'has_primary',
        'has_secondary',

        'country_id',

        'email',
        'phone',
        'website',
        'address',
        'logo',
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

        'status',
    ];

    protected $appends = [
        'logo_url',
        'report_card_logo_url',
        'principal_signature_url',
        'school_stamp_url',
    ];

    protected $casts = [
        'has_primary' => 'boolean',
        'has_secondary' => 'boolean',
        'show_watermark' => 'boolean',
        'allow_branding' => 'boolean',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorageService::class)->url($this->logo);
    }

    public function getReportCardLogoUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorageService::class)->url($this->report_card_logo ?: $this->logo);
    }

    public function getPrincipalSignatureUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorageService::class)->url($this->principal_signature);
    }

    public function getSchoolStampUrlAttribute(): ?string
    {
        return app(\App\Services\MediaStorageService::class)->url($this->school_stamp);
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function tenantPartition()
    {
        return $this->belongsTo(TenantPartition::class, 'tenant_partition_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function subscription()
    {
        return $this->hasOne(SchoolSubscription::class)
            ->where('is_current', true);
    }

    public function subscriptions()
    {
        return $this->hasMany(SchoolSubscription::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function parents()
    {
        return $this->hasMany(ParentModel::class);
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }

    public function academicSessions()
    {
        return $this->hasMany(AcademicSession::class);
    }

    public function terms()
    {
        return $this->hasMany(Term::class);
    }

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function streams()
    {
        return $this->hasMany(Stream::class);
    }
}
