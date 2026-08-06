<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hostel extends Model
{
    protected $fillable = [
        'school_id',
        'name',
        'type',
        'description',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function rooms()
    {
        return $this->hasMany(HostelRoom::class);
    }
}
