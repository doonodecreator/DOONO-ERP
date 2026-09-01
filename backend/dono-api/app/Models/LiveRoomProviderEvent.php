<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoomProviderEvent extends Model
{
    protected $fillable = ['provider', 'event_id', 'event_name', 'provider_room_id', 'payload', 'processed_at'];
    protected $casts = ['payload' => 'array', 'processed_at' => 'datetime'];
}
