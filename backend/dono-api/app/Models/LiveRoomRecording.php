<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoomRecording extends Model
{
    protected $fillable = ['live_room_id', 'school_id', 'provider', 'provider_egress_id', 'status', 'file_path', 'file_mime', 'file_size', 'duration_seconds', 'failure_message', 'started_at', 'ended_at', 'expires_at'];
    protected $casts = ['file_size' => 'integer', 'duration_seconds' => 'integer', 'started_at' => 'datetime', 'ended_at' => 'datetime', 'expires_at' => 'datetime'];

    public function room()
    {
        return $this->belongsTo(LiveRoom::class, 'live_room_id');
    }
}
