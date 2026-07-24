<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [

        'organization_id',

        'country_id',

        'owner_id',

        'name',

        'short_name',

        'school_type',

        'has_primary',

        'has_secondary',

        'school_code',

        'email',

        'phone',

        'website',

        'address',

        'logo',

        'status',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
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

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function divisions()
    {
        return $this->hasMany(Division::class);
    }

    public function classes()
    {
        return $this->hasMany(ClassModel::class, 'school_id');
    }

    public function streams()
    {
        return $this->hasMany(Stream::class);
    }

    public function subjects()
    {
        return $this->hasMany(Subject::class);
    }
}
