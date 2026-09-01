<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoomParticipant extends Model
{
    protected $fillable = ['live_room_id', 'school_id', 'user_id', 'student_id', 'display_alias', 'provider_identity', 'status', 'recording_consent', 'recording_consent_at', 'requested_at', 'admitted_at', 'removed_at', 'removed_by'];
    protected $casts = ['recording_consent' => 'boolean', 'recording_consent_at' => 'datetime', 'requested_at' => 'datetime', 'admitted_at' => 'datetime', 'removed_at' => 'datetime'];
    public function room() { return $this->belongsTo(LiveRoom::class, 'live_room_id'); }
    public function school() { return $this->belongsTo(School::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function student() { return $this->belongsTo(Student::class); }
    public function remover() { return $this->belongsTo(User::class, 'removed_by'); }
}
