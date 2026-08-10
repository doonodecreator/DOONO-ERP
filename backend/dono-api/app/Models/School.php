<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = [
        'organization_id',
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

        'status',
    ];

    protected $casts = [
        'has_primary' => 'boolean',
        'has_secondary' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

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
