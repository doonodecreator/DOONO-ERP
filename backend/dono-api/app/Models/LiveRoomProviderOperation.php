<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoomProviderOperation extends Model
{
    protected $fillable = ['live_room_id', 'school_id', 'operation', 'status', 'provider_status', 'error_message', 'attempted_at', 'completed_at'];
    protected $casts = ['provider_status' => 'integer', 'attempted_at' => 'datetime', 'completed_at' => 'datetime'];

    public function room()
    {
        return $this->belongsTo(LiveRoom::class, 'live_room_id');
    }
}
