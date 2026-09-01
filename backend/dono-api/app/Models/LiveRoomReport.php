<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoomReport extends Model
{
    protected $fillable = ['live_room_id', 'school_id', 'reporter_user_id', 'participant_user_id', 'reason', 'details', 'status', 'resolved_by', 'resolved_at'];
    protected $casts = ['resolved_at' => 'datetime'];
    public function room() { return $this->belongsTo(LiveRoom::class, 'live_room_id'); }
    public function school() { return $this->belongsTo(School::class); }
    public function reporter() { return $this->belongsTo(User::class, 'reporter_user_id'); }
    public function participant() { return $this->belongsTo(User::class, 'participant_user_id'); }
    public function resolver() { return $this->belongsTo(User::class, 'resolved_by'); }
}
