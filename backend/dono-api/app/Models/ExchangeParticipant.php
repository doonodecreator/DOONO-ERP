<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeParticipant extends Model
{
    protected $fillable = ['exchange_project_id', 'school_id', 'student_id', 'display_alias', 'status', 'approved_by', 'approved_at'];
    protected $casts = ['approved_at' => 'datetime'];
    public function project() { return $this->belongsTo(ExchangeProject::class, 'exchange_project_id'); }
    public function school() { return $this->belongsTo(School::class); }
    public function student() { return $this->belongsTo(Student::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
