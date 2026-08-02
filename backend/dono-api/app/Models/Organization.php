<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'short_name',
        'registration_number',
        'email',
        'phone',
        'alternative_phone',
        'website',
        'logo',
        'country',
        'state',
        'lga',
        'address',
        'status',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function schools()
    {
        return $this->hasMany(School::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function activeSchools()
    {
        return $this->schools()
            ->where('status', 'active');
    }

    public function primarySchools()
    {
        return $this->schools()
            ->where(function ($query) {
                $query->where('school_type', 'Primary')
                    ->orWhere('school_type', 'Combined');
            });
    }

    public function secondarySchools()
    {
        return $this->schools()
            ->where(function ($query) {
                $query->where('school_type', 'Secondary')
                    ->orWhere('school_type', 'Combined');
            });
    }
}
