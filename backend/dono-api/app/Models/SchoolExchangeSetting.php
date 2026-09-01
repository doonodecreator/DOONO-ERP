<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolExchangeSetting extends Model
{
    protected $fillable = ['school_id', 'enabled', 'international_enabled', 'safeguarding_note', 'approved_by', 'approved_at'];
    protected $casts = ['enabled' => 'boolean', 'international_enabled' => 'boolean', 'approved_at' => 'datetime'];
    public function school() { return $this->belongsTo(School::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
