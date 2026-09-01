<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeProjectSchool extends Model
{
    protected $fillable = ['exchange_project_id', 'school_id', 'status', 'invited_by', 'responded_by', 'responded_at'];
    protected $casts = ['responded_at' => 'datetime'];
    public function project() { return $this->belongsTo(ExchangeProject::class, 'exchange_project_id'); }
    public function school() { return $this->belongsTo(School::class); }
    public function inviter() { return $this->belongsTo(User::class, 'invited_by'); }
    public function responder() { return $this->belongsTo(User::class, 'responded_by'); }
}
