<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveRoom extends Model
{
    protected $fillable = ['school_id', 'exchange_project_id', 'host_user_id', 'title', 'description', 'audience_type', 'status', 'provider', 'provider_room_id', 'max_participants', 'recording_enabled', 'recording_consent_required', 'starts_at', 'ends_at', 'approved_by', 'approved_at', 'closed_at'];
    protected $casts = ['max_participants' => 'integer', 'recording_enabled' => 'boolean', 'recording_consent_required' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'approved_at' => 'datetime', 'closed_at' => 'datetime'];
    public function school() { return $this->belongsTo(School::class); }
    public function exchangeProject() { return $this->belongsTo(ExchangeProject::class); }
    public function host() { return $this->belongsTo(User::class, 'host_user_id'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function participants() { return $this->hasMany(LiveRoomParticipant::class); }
    public function reports() { return $this->hasMany(LiveRoomReport::class); }
    public function providerOperations() { return $this->hasMany(LiveRoomProviderOperation::class, 'live_room_id'); }
    public function recordings() { return $this->hasMany(LiveRoomRecording::class, 'live_room_id'); }
}
