<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeProject extends Model
{
    protected $fillable = ['school_id', 'title', 'description', 'subject', 'age_band', 'country_focus', 'status', 'allow_international', 'created_by', 'approved_by', 'approved_at', 'starts_at', 'ends_at'];
    protected $casts = ['allow_international' => 'boolean', 'approved_at' => 'datetime', 'starts_at' => 'datetime', 'ends_at' => 'datetime'];
    public function school() { return $this->belongsTo(School::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function participatingSchools() { return $this->hasMany(ExchangeProjectSchool::class); }
    public function participants() { return $this->hasMany(ExchangeParticipant::class); }
}
